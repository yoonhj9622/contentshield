import logging
import os
import datetime
from decimal import Decimal
from langchain_community.utilities import SQLDatabase
from langchain.chains import create_sql_query_chain
from langchain_community.tools.sql_database.tool import QuerySQLDataBaseTool
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from operator import itemgetter
from langchain_community.llms import Ollama
from langchain_community.chat_models import ChatOllama

# ✨ Groq support
from langchain_groq import ChatGroq

# 로깅 설정
logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self, model_name="llama-3.1-8b-instant", api_key=None):
        self.db = None
        self.llm = None
        self.chain = None
        self.chat_history = []
        
        # 1. DB 연결
        db_user = os.getenv("MYSQLUSER", "root")
        db_password = os.getenv("MYSQLPASSWORD", "1234")
        db_host = os.getenv("MYSQLHOST", "localhost")
        db_port = os.getenv("MYSQLPORT", "3306")
        db_name = os.getenv("MYSQLDATABASE", "sns_content_analyzer")
        
        self.db_url = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        
        try:
            # 토큰 절약을 위해 sample_rows 포함 안 함 + 사용할 테이블 제한 (빈 테이블 제외)
            self.db = SQLDatabase.from_uri(
                self.db_url, 
                sample_rows_in_table_info=0,
                include_tables=['analysis_results', 'comments'] 
            )
            logger.info(f"✅ Connected to Database: {db_name} (Restricted tables)")
        except Exception as e:
            logger.error(f"❌ Database Connection Failed: {e}")
            self.db = None

        # 2. LLM 초기화
        if api_key:
            logger.info(f"Initializing Groq LLM: {model_name}")
            self.llm = ChatGroq(temperature=0, model_name=model_name, api_key=api_key)
        else:
            logger.warning("⚠️ No Groq API Key found!")
            self.llm = None

        # 3. 체인 초기화
        if self.db and self.llm:
            self.chain = self._create_chain()

    def _create_chain(self, llm=None):
        """Text-to-SQL 체인 생성"""
        
        target_llm = llm if llm else self.llm
        if not target_llm: return None

        def clean_sql(text):
            cleaned = text.replace("```sql", "").replace("```", "").strip()
            if not cleaned.upper().startswith("SELECT"):
                 import re
                 match = re.search(r"SELECT.*", cleaned, re.IGNORECASE | re.DOTALL)
                 if match: cleaned = match.group(0)
            return cleaned

        sql_prompt = PromptTemplate.from_template(
            """You are a MySQL expert. Given an input question and conversation history, create a syntactically correct MySQL query to run.
            
            GUIDELINES:
            1. **Select Informative Columns**: SELECT `comment_text`, `author`, `toxicity_score`, `category`, `analyzed_at`.
            2. **Instructions vs Search Terms**:
               - NEVER use words like "요약", "분석", "리스트", "보여줘", "내 채널" in the WHERE clause. These are instructions, not keywords.
               - If the user says "내 채널의 댓글 요약해줘", your SQL should be: `SELECT ... FROM analysis_results LIMIT 10;` (NO WHERE CLAUSE).
               - ONLY use WHERE if the user asks for a specific topic (e.g., "스포츠 관련", "정치 관련") or a specific author.
            3. **Order**: If asked for "bad" or "toxic" comments, use `ORDER BY toxicity_score DESC`.
            4. **Strict Limit**: ALWAYS end with `LIMIT {top_k}`.
            
            IMPORTANT: Return ONLY the SQL query. Do not explain anything.
            
            Only use the following tables:
            {table_info}
            
            Conversation History:
            {history}
            
            Question: {input}
            """
        )

        # 2. SQL 생성 체인 (Prompt 주입) - 수동 구성 (history, top_k 전달)
        write_query = (
            RunnablePassthrough.assign(
                table_info=lambda x: self.db.get_table_info(),
                history=itemgetter("history"),
                top_k=itemgetter("top_k")
            )
            | sql_prompt
            | target_llm
            | StrOutputParser()
        )
        execute_query = QuerySQLDataBaseTool(db=self.db)
        
        answer_prompt = PromptTemplate.from_template(
            """Given the following user question, corresponding SQL query, and SQL result, answer the user question in Korean.
            
            Format your response as a structured report using Markdown:
            
            ## 📊 분석 보고서: [Title based on Question]
            
            ### 1. 요약 (Summary)
            - Briefly summarize key findings from the data.
            
            ### 2. 상세 분석 (Detailed Analysis)
            - Present the data in a **Markdown table** format for better readability:
            
            | 댓글 내용 | 작성자 | 위험도 | 카테고리 | 분석시간 |
            |----------|--------|--------|----------|----------|
            | (comment_text) | (author) | (toxicity_score) | (category) | (analyzed_at) |
            
            - After the table, provide additional insights or highlight critical findings (e.g., high toxicity scores).
            
            ### 3. 결론 (Conclusion)
            - Provide a brief conclusion or recommendation.
            
            ---
            
            **Guidelines:**
            - IF THE SQL RESULT IS EMPTY (e.g., [], None, or ""), YOU MUST SAY: "해당 조건에 맞는 데이터가 없습니다."
            - CRITICAL: NEVER, EVER MAKE UP OR HALLUCINATE DATA. Do not use the sample names like JohnDoe if the SQL result is empty.
            - Only use the data provided in 'SQL Result'.
            
            Question: {question}
            SQL Query: {query}
            SQL Result: {result}
            Answer: """
        )
        
        # 디버깅용 로그 체인 + 결과 캡처
        def log_step(state):
            logger.info(f"🔍 Generated SQL: {state.get('query')}")
            logger.info(f"🔍 SQL Result: {state.get('result')}")
            # 결과를 인스턴스 변수에 저장 (CSV export용)
            self.last_sql_result = state.get('result')
            return state

        def final_response(state):
            # SQL 결과가 없거나 비어있는 경우 즉시 종료
            if not state.get("result") or state.get("result") == "[]" or state.get("result") == "":
                return "해당 조건에 맞는 데이터가 없습니다."
            
            # 결과가 있는 경우에만 LLM에게 보고서 생성 요청
            chain = (
                answer_prompt.partial(table_info=self.db.get_table_info())
                | target_llm
                | StrOutputParser()
            )
            return chain.invoke(state)

        chain = (
            RunnablePassthrough.assign(query=write_query | clean_sql).assign(
                result=itemgetter("query") | execute_query
            )
            | log_step # 로그 출력 + 결과 캡처
            | final_response # 결과 확인 후 분기
        )
        return chain

    def query(self, question: str) -> dict:
        """Text-to-SQL 질의응답 (Retry & Fallback)"""
        if not self.chain:
            return {"answer": "서비스가 초기화되지 않았습니다 (DB 또는 LLM 연결 실패).", "sources": [], "data": []}
            
        # 히스토리 포맷팅 (토큰 절약을 위해 3개로 축소)
        history_str = ""
        if self.chat_history:
            history_str = "\n".join([f"User: {q}\nAI: {a}" for q, a in self.chat_history[-3:]]) 

        inputs = {
            "question": question, 
            "input": question, 
            "top_k": 10,
            "history": history_str
        }

        try:
            response = self.chain.invoke(inputs)
            # 히스토리 저장
            self.chat_history.append((question, response))
            
            # 원본 SQL 결과를 구조화된 데이터로 변환
            raw_data = self._parse_sql_result_to_dict(self.last_sql_result)
            
            return {
                "answer": response, 
                "sources": ["Database (MariaDB)"],
                "data": raw_data  # CSV export용 원본 데이터
            }
        except Exception as e:
            logger.error(f"SQL Chain failed: {e}")
            error_msg = str(e)
            
            # Rate Limit (429) or Token Limit (413) Handling
            if "429" in error_msg or "413" in error_msg or "rate_limit_exceeded" in error_msg or "history" in error_msg:
                logger.warning("⚠️ Rate/Token limit reached. Trying to fallback...")
                
                # 413(Token Limit)은 재시도해도 실패하므로 즉시 Fallback
                # 그 외(429)는 잠시 대기 후 재시도
                if "413" not in error_msg and "too large" not in error_msg:
                    import time
                    time.sleep(5) 
                    try:
                        response = self.chain.invoke(inputs)
                        self.chat_history.append((question, response))
                        raw_data = self._parse_sql_result_to_dict(self.last_sql_result)
                        return {
                            "answer": response, 
                            "sources": ["Database (MariaDB) - Retry"],
                            "data": raw_data
                        }
                    except Exception:
                        pass # Retry failed

                # Local Ollama Fallback
                try:
                    logger.info("🔄 Switching to Local Ollama Fallback...")
                    fallback_llm = ChatOllama(model="llama3", temperature=0)
                    fallback_chain = self._create_chain(llm=fallback_llm)
                    
                    if fallback_chain:
                        # Fallback 실행
                        response = fallback_chain.invoke(inputs)
                        raw_data = self._parse_sql_result_to_dict(self.last_sql_result)
                        return {
                            "answer": response + "\n\n(ℹ️ 트래픽/토큰 한도 초과로 로컬 AI가 생성한 답변입니다.)", 
                            "sources": ["Local Ollama"],
                            "data": raw_data
                        }
                except Exception as fallback_e:
                    logger.error(f"Fallback failed: {fallback_e}")
                    error_msg += f" | Fallback Error: {str(fallback_e)}"
            return {"answer": f"죄송합니다. 현재 이용량이 많거나 질문 내용이 너무 길어 답변을 생성할 수 없습니다. \n(상세 오류: {error_msg})", "sources": [], "data": []}
    
    def _parse_sql_result_to_dict(self, sql_result_str: str) -> list:
        """SQL 결과 문자열을 딕셔너리 리스트로 변환"""
        if not sql_result_str or sql_result_str == "[]" or sql_result_str == "":
            return []
        
        try:
            import ast
            from decimal import Decimal
            import datetime
            
            # eval 시 Decimal 및 datetime 타입을 인식할 수 있도록 전역 변수 설정
            eval_globals = {"Decimal": Decimal, "datetime": datetime}
            
            try:
                # ast.literal_eval은 기본 자료형만 지원함
                data = ast.literal_eval(sql_result_str)
            except:
                # Decimal, datetime 등이 포함된 경우 eval 사용 (eval_globals로 안전성 확보)
                data = eval(sql_result_str, eval_globals)
            
            if not isinstance(data, list):
                return []
                
            # 튜플 리스트를 딕셔너리 리스트로 변환
            # 정해진 순서: comment_text(0), author(1), toxicity_score(2), category(3), analyzed_at(4)
            result_list = []
            for row in data:
                if not isinstance(row, (list, tuple)) or len(row) < 5:
                    continue
                
                # Decimal -> float 변환
                tox = row[2]
                if isinstance(tox, Decimal):
                    tox = float(tox)
                elif not isinstance(tox, (int, float)):
                    tox = 0.0
                    
                # datetime -> string 변환
                at = row[4]
                if isinstance(at, (datetime.datetime, datetime.date)):
                    at = at.strftime("%Y-%m-%d %H:%M:%S")
                else:
                    at = str(at) if at else ""

                result_list.append({
                    "댓글내용": str(row[0]) if row[0] else "",
                    "작성자": str(row[1]) if row[1] else "",
                    "위험도": tox,
                    "카테고리": str(row[3]) if row[3] else "",
                    "분석시간": at
                })
            
            return result_list
        except Exception as e:
            logger.error(f"Failed to parse SQL result: {e}")
            return []

    def load_documents(self, directory_path: str = None):
        return {"status": "success", "message": "DB Mode active (No documents loaded)"}


    def clear_history(self):
        self.chat_history = []
        return True

    def get_query_results(self, question: str):
        """질문에 대한 SQL 결과를 JSON으로 반환 (프론트엔드에서 CSV 변환용)"""
        import re
        from langchain_core.prompts import PromptTemplate
        from langchain_core.output_parsers import StrOutputParser
        from langchain_core.runnables import RunnablePassthrough
        from langchain_community.tools.sql_database.tool import QuerySQLDataBaseTool
        
        try:
            # table_info 가져오기 (정확한 SQL 생성을 위해 필수)
            table_info = self.db.get_table_info()
            
            # Export용 프롬프트 개선 (스키마 정보 포함 및 규칙 강화)
            sql_prompt = PromptTemplate.from_template(
                """You are a MySQL expert. 
                Given an input question, create a syntactically correct MySQL query to run.
                
                Only use the following tables:
                {table_info}
                
                Question: {input}
                
                RULES:
                1. SELECT ONLY these 5 columns in this exact order: `comment_text`, `author`, `toxicity_score`, `category`, `analyzed_at`.
                2. DO NOT filter by the question itself. (e.g. If question is '요약해줘', DO NOT use `WHERE comment_text LIKE '%요약해줘%'`)
                3. If the question is a general request (summary, show all, list), OMIT the WHERE clause and just return rows.
                4. ONLY use WHERE clause if the user specifies a clear keyword (e.g. 'about sports', 'by John').
                5. ALWAYS end with `LIMIT 50`.
                
                SQL:"""
            )
            
            # SQL 생성 체인
            write_query = (
                RunnablePassthrough.assign(table_info=lambda x: table_info)
                | sql_prompt
                | self.llm
                | StrOutputParser()
            )
            
            execute_query = QuerySQLDataBaseTool(db=self.db)
            
            # SQL 생성
            inputs = {"input": question}
            sql = write_query.invoke(inputs)
            
            # SQL 정리: 마크다운 제거
            sql = sql.replace("```sql", "").replace("```", "").strip()
            
            # SELECT로 시작하지 않으면 SELECT 찾기
            if not sql.upper().startswith("SELECT"):
                match = re.search(r"SELECT.*", sql, re.IGNORECASE | re.DOTALL)
                if match:
                    sql = match.group(0)
            
            # 세미콜론 이후 설명 텍스트 제거 (단, 첫 번째 세미콜론만)
            if ';' in sql:
                # 첫 번째 세미콜론 위치 찾기
                semicolon_pos = sql.find(';')
                # 세미콜론 이후에 SQL 키워드가 없으면 잘라내기
                after_semicolon = sql[semicolon_pos+1:].strip()
                if after_semicolon and not any(keyword in after_semicolon.upper()[:50] for keyword in ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE']):
                    sql = sql[:semicolon_pos+1]
            
            logger.info(f"🔍 Generated SQL for export: {sql}")
            
            # SQL 실행
            result = execute_query.invoke(sql)
            logger.info(f"🔍 SQL Result (first 200 chars): {str(result)[:200]}...")
            
            if not result or result == "[]":
                logger.warning("Export query returned empty result")
                return []
            
            # 결과 파싱 (통합된 파싱 메서드 사용)
            result_list = self._parse_sql_result_to_dict(result)
            
            logger.info(f"✅ Export: Converted {len(result_list)} rows to JSON")
            return result_list
            
        except Exception as e:
            logger.error(f"Get query results failed: {e}")
            
            # Rate Limit (429) 처리 - 한번 더 재시도
            if "429" in str(e) or "rate_limit" in str(e).lower():
                import time
                logger.warning("⚠️ Export Rate limit reached. Retrying in 3s...")
                time.sleep(3)
                try:
                    # 재시도시에는 정말 최소한의 정보로 재시도
                    fallback_prompt = PromptTemplate.from_template("SELECT comment_text, author, toxicity_score, category, analyzed_at FROM analysis_results LIMIT 10;")
                    sql = (fallback_prompt | self.llm | StrOutputParser()).invoke({})
                    sql = sql.replace("```sql", "").replace("```", "").strip()
                    result = execute_query.invoke(sql)
                    if result:
                        return self._parse_sql_result_to_dict(result)
                except:
                    pass
                    
            import traceback
            logger.error(traceback.format_exc())
            return []

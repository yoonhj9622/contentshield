// ==================== src/components/Layout/Footer.jsx ====================
export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Copyright */}
          <div className="text-sm text-gray-500">
            © {currentYear} SNS Content Analyzer. All rights reserved.
          </div>

          {/* Links */}
          <div className="flex space-x-6">
            <a
              href="/about"
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              About
            </a>
            <a
              href="/privacy"
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Terms of Service
            </a>
            <a
              href="/contact"
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Contact
            </a>
          </div>

          {/* Version */}
          <div className="text-sm text-gray-400">
            Version 1.0.0
          </div>
        </div>
      </div>
    </footer>
  )
}
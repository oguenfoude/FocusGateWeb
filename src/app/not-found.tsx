import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-gray-300">404</p>
        <h1 className="text-xl font-semibold text-gray-700">Page Not Found</h1>
        <p className="text-sm text-gray-500">The page you are looking for does not exist.</p>
        <Link href="/" className="inline-block mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors">
          Go Home
        </Link>
      </div>
    </div>
  )
}

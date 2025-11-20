export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-gray-300 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-4 text-center text-gray-600 text-xs sm:text-sm">
        <p className="font-medium text-gray-700">
          © {year} Gradslist • Buy. Sell. Go.
        </p>
        <p className="mt-1">Created for UNCC Capstone Project</p>
      </div>
    </footer>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-sm text-gray-500 dark:text-gray-400 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p>© {new Date().getFullYear()} LessGo. Built for students, by students.</p>
        <p>Made with ❤️ using Next.js, Express &amp; PostgreSQL.</p>
      </div>
    </footer>
  );
}

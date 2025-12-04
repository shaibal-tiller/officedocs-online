export function Footer() {
  return (
    <footer className="bg-tiller-lime py-3 mt-auto">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-foreground">
        <p className="italic text-center sm:text-left">
          Green Avenue Park, Level# 10, House# 01, Road# 03, Block# A, Section# 06, Mirpur, Dhaka 1216.
        </p>
        <a 
          href="https://www.tiller.com.bd" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-tiller-green font-medium hover:underline"
        >
          www.tiller.com.bd
        </a>
      </div>
    </footer>
  );
}

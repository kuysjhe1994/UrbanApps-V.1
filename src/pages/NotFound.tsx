import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-primary">404</span>
        </div>
        <h1 className="text-2xl font-bold mb-2 text-foreground">Page not found</h1>
        <p className="text-muted-foreground mb-6">The page you are looking for does not exist or has been moved.</p>
        <a href="/" className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-gradient-primary text-primary-foreground shadow-ar-glow">
          Go back home
        </a>
      </div>
    </div>
  );
};

export default NotFound;

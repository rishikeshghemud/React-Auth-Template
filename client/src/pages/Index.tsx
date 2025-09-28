import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background">
      <div className="text-center space-y-8 animate-float">
        <div className="space-y-12">
          <h1 className="text-6xl md:text-8xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Welcome to My Auth App
          </h1>
          <div className="w-24 h-1 bg-gradient-primary mx-auto rounded-full opacity-60"></div>
          <div className="space-x-4">
            <Link to="/login">
              <Button size="lg" variant="outline"> Login </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline"> Register </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Index;
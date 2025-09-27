const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background">
      <div className="text-center space-y-8 animate-float">
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Hello World
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-light">
            Welcome to your beautiful React app
          </p>
        </div>
        
        <div className="w-24 h-1 bg-gradient-primary mx-auto rounded-full opacity-60"></div>
      </div>
    </div>
  );
};

export default Index;
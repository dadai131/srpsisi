const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-foreground tracking-tight">
          Stream<span className="text-primary">Hub</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Filmes, Séries, Animes e Doramas em um só lugar.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity">
            Explorar Catálogo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;

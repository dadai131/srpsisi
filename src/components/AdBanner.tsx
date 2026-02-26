interface AdBannerProps {
  position?: 'top' | 'bottom' | 'sidebar';
}

export function AdBanner({ position = 'bottom' }: AdBannerProps) {
  return (
    <div className="w-full py-4">
      <div className="container mx-auto px-4">
        <div className="relative rounded-lg bg-gradient-to-r from-secondary via-card to-secondary border border-border/50 overflow-hidden">
          <div className="flex items-center justify-center py-8 px-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Publicidade</p>
              <p className="text-sm text-muted-foreground">Espaço reservado para anúncios</p>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
      </div>
    </div>
  );
}

export default function Advertisement() {
  return (
    <section className="home-advertisement" aria-label="Discover Burak restaurant">
      <video
        controls
        playsInline
        preload="none"
        poster="/img/home/advertisement.webp"
        aria-label="Burak restaurant video"
      >
        <source src="/video/burak-ads.mp4" type="video/mp4" />
        Your browser does not support video playback.
      </video>
    </section>
  );
}

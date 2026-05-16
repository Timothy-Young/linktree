"use client";

export function TrackedLink({
  linkId,
  profileId,
  href,
  title,
  btnColor,
  btnTextColor,
}: {
  linkId: string;
  profileId: string;
  href: string;
  title: string;
  btnColor: string;
  btnTextColor: string;
}) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Modifier keys, middle-click, etc. — let the browser handle natively.
    if (
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.button !== 0
    ) {
      void recordClick(linkId, profileId);
      return;
    }

    e.preventDefault();
    // Fire-and-forget via fetch keepalive so the request survives navigation.
    void recordClick(linkId, profileId);
    window.location.href = href;
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      onAuxClick={() => void recordClick(linkId, profileId)}
      className="block w-full rounded-lg px-4 py-4 text-center text-base font-medium transition-transform hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
      style={{ background: btnColor, color: btnTextColor }}
    >
      {title}
    </a>
  );
}

function recordClick(linkId: string, profileId: string) {
  const body = JSON.stringify({
    link_id: linkId,
    profile_id: profileId,
    referrer: typeof document !== "undefined" ? document.referrer : null,
  });
  try {
    return fetch("/api/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    return Promise.resolve();
  }
}

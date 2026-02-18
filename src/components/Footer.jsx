import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { useLocal } from "../contexts/LocalContext";

const REDES = [
  { key: "facebook", icon: "fab fa-facebook", label: "Facebook" },
  { key: "instagram", icon: "fab fa-instagram", label: "Instagram" },
  { key: "tiktok", icon: "fab fa-tiktok", label: "TikTok" },
  { key: "youtube", icon: "fab fa-youtube", label: "YouTube" },
  { key: "x", icon: "fab fa-x-twitter", label: "X" },
  { key: "whatsapp", icon: "fab fa-whatsapp", label: "WhatsApp" },
];

const Footer = () => {
  const { localId } = useLocal();
  const [socials, setSocials] = useState({});

  useEffect(() => {
    const cargarSociales = async () => {
      if (!localId) {
        setSocials({});
        return;
      }
      try {
        const res = await api.get("/social-config/public");
        const data = res?.data?.socials || {};
        setSocials(data);
      } catch {
        setSocials({});
      }
    };

    cargarSociales();
  }, [localId]);

  const redesActivas = useMemo(
    () =>
      REDES.filter((red) => Boolean(socials?.[red.key]?.enabled) && Boolean(socials?.[red.key]?.url)),
    [socials]
  );

  return (
    <footer className="bg-black border-t mt-10 py-6 text-center text-gray-200 ">
      <p className="text-sm mb-2">
        © {new Date().getFullYear()} COFFEE WAFFLES - Todos los derechos reservados
      </p>
      <div className="flex justify-center gap-4 text-xl text-gray-600 mt-2">
        {redesActivas.map((red) => (
          <a
            key={red.key}
            href={socials[red.key].url}
            target="_blank"
            rel="noreferrer"
            title={red.label}
            aria-label={red.label}
          >
            <i className={red.icon}></i>
          </a>
        ))}
      </div>
    </footer>
  );
};

export default Footer;

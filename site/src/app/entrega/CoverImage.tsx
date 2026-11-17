import { cropStyle, type CoverCrops } from "@/lib/coverCrop";

// Capa com o enquadramento de cada tela. São três <img> com o mesmo arquivo (o navegador baixa
// uma vez só) e o CSS mostra a do tamanho de tela atual: celular, tablet ou computador.
export default function CoverImage({
  src,
  crops,
  priority = false,
  className = "",
}: {
  src: string;
  crops?: CoverCrops;
  priority?: boolean;
  className?: string;
}) {
  const base = `absolute inset-0 h-full w-full object-cover ${className}`;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" fetchPriority={priority ? "high" : undefined} style={cropStyle(crops?.mobile)} className={`${base} md:hidden`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" style={cropStyle(crops?.tablet)} className={`${base} hidden md:block xl:hidden`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" style={cropStyle(crops?.desktop)} className={`${base} hidden xl:block`} />
    </>
  );
}

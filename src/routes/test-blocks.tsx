import { createFileRoute } from "@tanstack/react-router";
import { RenderPage } from "@/components/blocks/RenderPage";

export const Route = createFileRoute("/test-blocks")({
  component: TestBlocks,
});

function TestBlocks() {
  const content = {
    sections: [
      {
        id: "benefits",
        type: "benefits",
        props: {
          title: "Benefícios",
          subtitle: "Veja os principais benefícios do nosso produto",
          items: [
            { title: "Performance", description: "Renderização otimizada e componentes leves." },
            { title: "Design System", description: "Tokens semânticos e dark mode prontos." },
            { title: "Analytics", description: "Pageviews, clicks e eventos rastreados." },
          ],
        },
      },
      {
        id: "features",
        type: "features",
        props: {
          title: "Recursos",
          subtitle: "Tudo que você precisa para escalar",
          items: [
            { title: "Drag and Drop", description: "Arraste blocos e monte páginas em segundos." },
            { title: "Versionamento", description: "Cada save cria uma versão imutável." },
            { title: "SEO", description: "Título, descrição e imagem OG por página." },
          ],
        },
      },
      {
        id: "testimonials",
        type: "testimonials",
        props: {
          title: "Depoimentos",
          items: [
            { name: "Ana", role: "CEO", quote: "A plataforma transformou nossa presença digital." },
            { name: "Bruno", role: "CMO", quote: "Criamos landing pages em minutos, não dias." },
            { name: "Carla", role: "Product", quote: "A integração com analytics é fantástica." },
          ],
        },
      },
      {
        id: "contact",
        type: "contact",
        props: {
          title: "Contato",
          subtitle: "Entre em contato com nossa equipe",
          email: "ola@exemplo.com",
          phone: "+55 11 99999-9999",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <RenderPage content={content as any} />
    </div>
  );
}

const defaultQuestions = [
  {
    text: "Qual o tipo do projeto?",
    options: [
      { label: "Ajuste Pontual", weight: -20, hours: 4 },
      { label: "Landing Page", weight: 0, hours: 16 },
      { label: "Site Institucional", weight: 20, hours: 30 },
      { label: "E-commerce", weight: 50, hours: 60 },
      { label: "Sistema Web / SaaS", weight: 100, hours: 80 },
      { label: "App Mobile", weight: 150, hours: 100 }
    ]
  },
  {
    text: "Qual a complexidade do Backend/Banco de Dados?",
    options: [
      { label: "Nenhuma (Apenas visual)", weight: 0, hours: 0 },
      { label: "Baixa (Formulários simples)", weight: 10, hours: 10 },
      { label: "Média (Painel de admin, login)", weight: 30, hours: 25 },
      { label: "Alta (Pagamentos, APIs externas)", weight: 60, hours: 50 },
      { label: "Muito Alta (Microserviços, escalabilidade)", weight: 100, hours: 100 }
    ]
  },
  {
    text: "Qual o nível de Design/UI exigido?",
    options: [
      { label: "Básico (Templates prontos)", weight: -10, hours: 0 },
      { label: "Intermediário (Adaptação de tema)", weight: 10, hours: 10 },
      { label: "Avançado (Design único no Figma)", weight: 40, hours: 25 }
    ]
  },
  {
    text: "Inclui setup de Infraestrutura/Deploy?",
    options: [
      { label: "Não (Cliente resolve)", weight: 0, hours: 0 },
      { label: "Sim (Deploy básico: Vercel/Netlify)", weight: 10, hours: 4 },
      { label: "Sim (Deploy complexo: AWS, Docker)", weight: 30, hours: 15 }
    ]
  },
  {
    text: "Como é o prazo de entrega?",
    options: [
      { label: "Tranquilo (Sem pressa)", weight: -10, hours: 0 },
      { label: "Normal (Padrão)", weight: 0, hours: 0 },
      { label: "Urgente (Trabalhar noites/finais de semana)", weight: 50, hours: 0 }
    ]
  },
  {
    text: "Qual a qualidade do material fornecido pelo cliente?",
    options: [
      { label: "Tudo pronto (Textos, logos, acessos)", weight: -10, hours: 0 },
      { label: "Parcial (Precisa de ajustes)", weight: 10, hours: 5 },
      { label: "Nada pronto (Vou ter que criar tudo)", weight: 40, hours: 15 }
    ]
  },
  {
    text: "Qual o perfil do cliente?",
    options: [
      { label: "Tranquilo (Aprova rápido)", weight: -10, hours: 0 },
      { label: "Detalha muito (Algumas reuniões)", weight: 10, hours: 5 },
      { label: "Muito exigente (Microgerenciamento)", weight: 40, hours: 15 }
    ]
  },
  {
    text: "Haverá integração com sistemas legados ou de terceiros?",
    options: [
      { label: "Não", weight: 0, hours: 0 },
      { label: "Sim, APIs modernas e documentadas", weight: 20, hours: 10 },
      { label: "Sim, sistemas antigos sem documentação", weight: 60, hours: 30 }
    ]
  },
  {
    text: "Haverá transferência de Propriedade Intelectual (Código Fonte)?",
    options: [
      { label: "Não (Uso como serviço/Licença)", weight: 0, hours: 0 },
      { label: "Sim (Cliente é dono do código)", weight: 30, hours: 0 }
    ]
  },
  {
    text: "Suporte e Garantia após a entrega?",
    options: [
      { label: "Nenhum (Entregou, acabou)", weight: 0, hours: 0 },
      { label: "Garantia de 30 dias (Apenas bugs)", weight: 10, hours: 10 },
      { label: "Contrato mensal de suporte", weight: -10, hours: 0 }
    ]
  }
];

const Engine = {
  defaultQuestions: defaultQuestions,
  questions: defaultQuestions,
  
  calculate: function(answers, baseHourlyRate) {
    let totalMultiplier = 1.0;
    let baseHours = 0;
    let extraHours = 0;
    let justifications = [];

    answers.forEach((ansIndex, qIndex) => {
      if (ansIndex === null || ansIndex === undefined) return;
      
      const q = this.questions[qIndex];
      const opt = q.options[ansIndex];
      
      // Converte a porcentagem inteira de volta para multiplicador (ex: 20 -> 1.2)
      totalMultiplier *= (1 + opt.weight / 100);
      
      if (qIndex === 0) {
        baseHours = opt.hours;
      } else {
        extraHours += opt.hours;
      }

      if (opt.weight !== 0 || opt.hours > 0) {
        let effect = [];
        if (opt.weight > 0) effect.push(`+${opt.weight}% valor`);
        else if (opt.weight < 0) effect.push(`${opt.weight}% valor`);
        
        if (opt.hours > 0) effect.push(`+${opt.hours}h`);
        
        if (effect.length > 0) {
          justifications.push({ label: q.text, value: effect.join(' e ') });
        }
      }
    });

    const totalHours = baseHours + extraHours;
    const finalValue = (totalHours * baseHourlyRate) * totalMultiplier;

    return {
      estimatedHours: totalHours,
      minimum: finalValue * 0.8,
      suggested: finalValue,
      premium: finalValue * 1.5,
      justifications: justifications
    };
  }
};

if (typeof window !== 'undefined') {
  window.Engine = Engine;
}

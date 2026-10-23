export const voiceSuggestions = ['Como organizar minhas dúvidas?', 'O que perguntar na próxima consulta?', 'Quais são os trimestres da gestação?'];

export function demoReply(message:string, week:number) {
  const text = message.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  if (/dor|sangra|falta de ar|desmai|emergencia|urgencia/.test(text)) return 'Nesta demonstração, não posso avaliar sintomas ou indicar tratamentos. Se você estiver passando por uma situação urgente, procure atendimento médico imediatamente. Para outras dúvidas sobre sintomas, converse com sua equipe de saúde.';
  if (/remedio|medicamento|dose|diagnostico|prescre/.test(text)) return 'Não posso recomendar medicamentos, doses ou fazer diagnósticos. Leve essa dúvida ao profissional que acompanha sua gestação. Posso ajudar a organizar as perguntas para a consulta.';
  if (/trimestre|semana|etapa/.test(text)) return `No perfil fictício selecionado, a gestação está na semana ${week}. Os trimestres são divisões gerais usadas para organizar o acompanhamento. As datas e os cuidados de cada etapa devem ser confirmados com sua equipe de saúde. Que tal anotar suas dúvidas para a próxima consulta?`;
  if (/consulta|pergunt|exame/.test(text)) return 'Você pode levar uma lista com três pontos: como tem se sentido, dúvidas sobre os exames e o que conversar sobre os próximos passos do acompanhamento. Anote também as orientações da equipe. Assim fica mais fácil lembrar do que é importante para você.';
  if (/duvida|organiz|ansied|medo/.test(text)) return 'Você pode anotar suas dúvidas assim que surgirem e separar por assunto: rotina, consultas e como está se sentindo. Não precisa resolver tudo de uma vez. Escolha o que mais preocupa você para conversar com sua equipe de saúde.';
  return 'Esta é uma demonstração guiada com respostas preparadas. Experimente perguntar como organizar suas dúvidas, o que levar para a próxima consulta ou sobre as etapas da gestação. Para orientações individuais, converse com sua equipe de saúde.';
}

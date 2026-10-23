import {describe,it,expect} from 'vitest';
import {demoReply} from './voiceDemo';
import {sessionConfig} from '../../../functions/src/services/liaSession';

describe('Demonstração e configuração da Lia',()=>{
  it('identifica respostas guiadas quando não há tema preparado',()=>{
    expect(demoReply('Qual é a previsão do tempo?',26)).toContain('demonstração guiada');
  });
  it('usa apenas a semana informada no exemplo',()=>{
    expect(demoReply('Em qual semana estou?',31)).toContain('semana 31');
  });
  it('não recomenda medicamentos e encaminha situações urgentes',()=>{
    expect(demoReply('Qual dose de medicamento?',26)).toContain('Não posso recomendar');
    expect(demoReply('Estou com sangramento',26)).toContain('atendimento médico imediatamente');
  });
  it('cria credencial temporária, limita saída e não inventa uma fase gestacional',()=>{
    const config=sessionConfig('modelo-de-teste',undefined);
    expect(config.expires_after.seconds).toBe(60);
    expect(config.session.max_output_tokens).toBe(350);
    expect(config.session.instructions).toContain('Não há semana gestacional confirmada');
    expect(config.session.instructions).toContain('Não diagnostique');
  });
});

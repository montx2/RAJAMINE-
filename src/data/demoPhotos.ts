/**
 * Galeria demonstrativa de fotografias de campo.
 * Todas as imagens são sintéticas/demonstrativas (geradas para o protótipo),
 * nunca fotos reais de clientes. Servidas de /public/demo.
 */
import type { Photo } from './types';

export interface DemoPhoto {
  src: string;
  legenda: string;
  categoria: Photo['categoria'];
  grupo: 'Equipamentos' | 'Atividades & contexto';
}

export const DEMO_PHOTOS: DemoPhoto[] = [
  { src: '/demo/foto-eq2041.jpg', legenda: 'Telemetria no painel — etiqueta EQ-2041 (nítida)', categoria: 'equipamento', grupo: 'Equipamentos' },
  { src: '/demo/foto-eq1087.jpg', legenda: 'Rastreador no chassi — etiqueta EQ-1087 (poeira leve)', categoria: 'equipamento', grupo: 'Equipamentos' },
  { src: '/demo/foto-eq3315.jpg', legenda: 'Sensor de fadiga — etiqueta EQ-3315 (suja, com reflexo)', categoria: 'equipamento', grupo: 'Equipamentos' },
  { src: '/demo/foto-camera-fadiga.jpg', legenda: 'Câmera de fadiga no para-brisa — EQ-3315', categoria: 'equipamento', grupo: 'Equipamentos' },
  { src: '/demo/foto-camera-externa.jpg', legenda: 'Câmera embarcada externa — EQ-4520', categoria: 'equipamento', grupo: 'Equipamentos' },
  { src: '/demo/foto-chassi-gps.jpg', legenda: 'Rastreador GPS no chassi — EQ-1087 (ângulo inferior)', categoria: 'equipamento', grupo: 'Equipamentos' },
  { src: '/demo/foto-painel-cp101.jpg', legenda: 'Telemetria CP-101 no painel — TELEMETRIA 0987', categoria: 'equipamento', grupo: 'Equipamentos' },
  { src: '/demo/foto-tablet-pulsus.jpg', legenda: 'Tablet Pulsus no suporte — PULSUS 2758 / telemetria 0987', categoria: 'equipamento', grupo: 'Equipamentos' },
  { src: '/demo/foto-galileo-rotograma.jpg', legenda: 'Módulo Galileo / rotograma — ID 867782071392430', categoria: 'equipamento', grupo: 'Equipamentos' },
  { src: '/demo/foto-sensor-carga.jpg', legenda: 'Sensor de carga no eixo — EQ-2988', categoria: 'equipamento', grupo: 'Equipamentos' },
  { src: '/demo/foto-atividade.jpg', legenda: 'Registro da instalação em campo (atividade)', categoria: 'atividade', grupo: 'Atividades & contexto' },
  { src: '/demo/foto-instalacao-chicote.jpg', legenda: 'Conexão do chicote durante a instalação — tag EQ-2041', categoria: 'atividade', grupo: 'Atividades & contexto' },
  { src: '/demo/foto-checklist-campo.jpg', legenda: 'Checklist de instalação em campo — tag EQ-5102', categoria: 'atividade', grupo: 'Atividades & contexto' },
  { src: '/demo/foto-caminhao-mina.jpg', legenda: 'Caminhão fora de estrada na mina (contexto da viagem)', categoria: 'atividade', grupo: 'Atividades & contexto' },
];

export function demoPhotoBySrc(src: string): DemoPhoto | undefined {
  return DEMO_PHOTOS.find((d) => d.src === src);
}

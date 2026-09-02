import React, { useState } from 'react';
import { GisLayer, AttributeFilter } from '../types/gis';
import { Sparkles, Send, Bot, User, Check, Loader2, AlertCircle, HelpCircle } from 'lucide-react';

interface AiGisModalProps {
  layer: GisLayer | null;
  isOpen: boolean;
  onClose: () => void;
  onApplySuggestedFilter: (layerId: string, filter: AttributeFilter) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  suggestedFilter?: {
    property: string;
    operator: string;
    value: any;
    explanation: string;
  };
}

export const AiGisModal: React.FC<AiGisModalProps> = ({
  layer,
  isOpen,
  onClose,
  onApplySuggestedFilter
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Olá! Sou seu Copiloto de Inteligência Espacial e GIS. Você pode me pedir para analisar a distribuição dos dados, resumir atributos ou solicitar filtros em linguagem natural (ex: *"Mostre apenas capitais com população > 5 milhões"* ou *"Filtre estados da região Sudeste"*).'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [appliedFilterIds, setAppliedFilterIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const quickPrompts = [
    'Quais atributos se destacam nesta camada?',
    'Filtre os registros com valores acima da média',
    'Existe alguma concentração espacial visível nos dados?'
  ];

  const handleSendMessage = async (promptText: string) => {
    if (!promptText.trim()) return;

    const userMsg: Message = {
      id: 'msg_' + Date.now(),
      role: 'user',
      text: promptText
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-gis-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          layerName: layer?.name || 'Nenhuma',
          propertiesSchema: layer?.propertiesSchema || [],
          sampleFeatures: (layer?.data.features || []).slice(0, 5)
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Erro HTTP ${response.status}`);
      }

      const data = await response.json();
      let assistantText = data.response || 'Sem resposta';
      let suggestedFilter: any = undefined;

      // Extract JSON if model returned structured filter
      const jsonMatch = assistantText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.suggestedFilter) {
            suggestedFilter = parsed.suggestedFilter;
          }
          // Remove the JSON block from the text shown to the user
          assistantText = assistantText.replace(jsonMatch[0], '').trim();
        } catch {
          // ignore parsing error
        }
      }

      const assistantMsg: Message = {
        id: 'msg_ai_' + Date.now(),
        role: 'assistant',
        text: assistantText,
        suggestedFilter
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Erro na consulta AI:', err);
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          text: `Não foi possível contatar o assistente de IA: ${err.message}. Você pode configurar a chave nos Segredos da aplicação.`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilter = (msgId: string, filterData: any) => {
    if (!layer) return;

    const newFilter: AttributeFilter = {
      id: 'ai_filter_' + Date.now(),
      property: filterData.property,
      type: typeof filterData.value === 'number' ? 'number' : 'string',
      operator: filterData.operator || '=',
      value: filterData.value,
      active: true
    };

    onApplySuggestedFilter(layer.id, newFilter);
    setAppliedFilterIds(prev => new Set(prev).add(msgId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        id="ai-gis-modal"
        className="w-full max-w-2xl bg-white border border-slate-300/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Assistente de Inteligência Espacial (AI GIS)</h2>
              <p className="text-xs text-slate-500">
                Camada ativa: <strong className="text-indigo-700">{layer?.name || 'Nenhuma'}</strong> ({layer?.featureCount || 0} feições)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100">
            ✕
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-xs'
                  : 'bg-slate-100/80 border border-slate-300/80 text-slate-800 rounded-tl-xs space-y-3'
              }`}>
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Suggested Filter action card */}
                {msg.suggestedFilter && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-indigo-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Filtro Sugerido pela IA
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-indigo-200 text-indigo-800 rounded-full font-mono">
                        {msg.suggestedFilter.property} {msg.suggestedFilter.operator} {String(msg.suggestedFilter.value)}
                      </span>
                    </div>
                    {msg.suggestedFilter.explanation && (
                      <p className="text-indigo-900/70 text-[11px]">{msg.suggestedFilter.explanation}</p>
                    )}
                    <button
                      onClick={() => handleApplyFilter(msg.id, msg.suggestedFilter)}
                      disabled={appliedFilterIds.has(msg.id)}
                      className={`w-full py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        appliedFilterIds.has(msg.id)
                          ? 'bg-emerald-200 text-emerald-700 border border-emerald-200'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                      }`}
                    >
                      {appliedFilterIds.has(msg.id) ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Filtro Aplicado à Camada</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Aplicar este Filtro no Mapa</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-700 flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-100/80 border border-slate-300/80 rounded-2xl rounded-tl-xs p-3.5 text-xs text-slate-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Analisando geometria e atributos...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="px-6 py-2 bg-slate-50/60 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 shrink-0">Sugestões:</span>
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp)}
              disabled={isLoading}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-full border border-slate-300 whitespace-nowrap transition-colors"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-200 bg-white/90 flex gap-2">
          <input
            type="text"
            placeholder="Digite uma pergunta sobre os dados ou peça um filtro..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(inputPrompt);
              }
            }}
            className="flex-1 px-4 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => handleSendMessage(inputPrompt)}
            disabled={isLoading || !inputPrompt.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

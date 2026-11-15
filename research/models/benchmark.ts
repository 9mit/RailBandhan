export interface ModelCandidate {
  id: string;
  name: string;
  family: 'Qwen' | 'Llama' | 'Gemma' | 'Mistral' | 'BGE' | 'MiniLM';
  task: 'embedding' | 'classification' | 'rag_presentation' | 'vlm_ocr_fallback';
  parameterCount: string;
  quantization: string;
  license: string;
  commercialUse: boolean;
  vramRequiredMb: number;
  ramRequiredMb: number;
  cpuInferenceTokensPerSec: number;
  indianLanguageSupport: 'High' | 'Medium' | 'Low';
  recommendedRuntime: 'llama.cpp' | 'Ollama' | 'vLLM' | 'ONNX Runtime' | 'Transformers.js';
}

export const EVALUATED_MODELS: ModelCandidate[] = [
  {
    id: 'bge-small-en-v1.5',
    name: 'BAAI/bge-small-en-v1.5',
    family: 'BGE',
    task: 'embedding',
    parameterCount: '33M',
    quantization: 'ONNX / FP32 / Q8',
    license: 'MIT',
    commercialUse: true,
    vramRequiredMb: 0,
    ramRequiredMb: 150,
    cpuInferenceTokensPerSec: 450,
    indianLanguageSupport: 'Medium',
    recommendedRuntime: 'Transformers.js',
  },
  {
    id: 'all-minilm-l6-v2',
    name: 'sentence-transformers/all-MiniLM-L6-v2',
    family: 'MiniLM',
    task: 'embedding',
    parameterCount: '22M',
    quantization: 'ONNX / Q8',
    license: 'Apache-2.0',
    commercialUse: true,
    vramRequiredMb: 0,
    ramRequiredMb: 120,
    cpuInferenceTokensPerSec: 520,
    indianLanguageSupport: 'Low',
    recommendedRuntime: 'Transformers.js',
  },
  {
    id: 'qwen-2.5-0.5b-instruct',
    name: 'Qwen/Qwen2.5-0.5B-Instruct',
    family: 'Qwen',
    task: 'classification',
    parameterCount: '0.49B',
    quantization: 'Q4_K_M',
    license: 'Apache-2.0',
    commercialUse: true,
    vramRequiredMb: 400,
    ramRequiredMb: 600,
    cpuInferenceTokensPerSec: 65,
    indianLanguageSupport: 'High',
    recommendedRuntime: 'Ollama',
  },
  {
    id: 'qwen-2.5-1.5b-instruct',
    name: 'Qwen/Qwen2.5-1.5B-Instruct',
    family: 'Qwen',
    task: 'rag_presentation',
    parameterCount: '1.54B',
    quantization: 'Q4_K_M',
    license: 'Apache-2.0',
    commercialUse: true,
    vramRequiredMb: 1200,
    ramRequiredMb: 1800,
    cpuInferenceTokensPerSec: 32,
    indianLanguageSupport: 'High',
    recommendedRuntime: 'Ollama',
  },
  {
    id: 'qwen-2.5-7b-instruct',
    name: 'Qwen/Qwen2.5-7B-Instruct',
    family: 'Qwen',
    task: 'rag_presentation',
    parameterCount: '7.61B',
    quantization: 'Q4_K_M',
    license: 'Apache-2.0',
    commercialUse: true,
    vramRequiredMb: 5200,
    ramRequiredMb: 6500,
    cpuInferenceTokensPerSec: 8,
    indianLanguageSupport: 'High',
    recommendedRuntime: 'vLLM',
  },
  {
    id: 'llama-3.2-1b-instruct',
    name: 'meta-llama/Llama-3.2-1B-Instruct',
    family: 'Llama',
    task: 'rag_presentation',
    parameterCount: '1.23B',
    quantization: 'Q4_K_M',
    license: 'Llama 3.2 Community License',
    commercialUse: true,
    vramRequiredMb: 950,
    ramRequiredMb: 1400,
    cpuInferenceTokensPerSec: 38,
    indianLanguageSupport: 'Medium',
    recommendedRuntime: 'Ollama',
  },
  {
    id: 'gemma-2-2b-it',
    name: 'google/gemma-2-2b-it',
    family: 'Gemma',
    task: 'rag_presentation',
    parameterCount: '2.61B',
    quantization: 'Q4_K_M',
    license: 'Gemma Terms of Use',
    commercialUse: true,
    vramRequiredMb: 1800,
    ramRequiredMb: 2400,
    cpuInferenceTokensPerSec: 22,
    indianLanguageSupport: 'Medium',
    recommendedRuntime: 'llama.cpp',
  },
  {
    id: 'qwen-2-vl-2b-instruct',
    name: 'Qwen/Qwen2-VL-2B-Instruct',
    family: 'Qwen',
    task: 'vlm_ocr_fallback',
    parameterCount: '2.21B',
    quantization: 'Q4_K_M',
    license: 'Apache-2.0',
    commercialUse: true,
    vramRequiredMb: 2200,
    ramRequiredMb: 3000,
    cpuInferenceTokensPerSec: 12,
    indianLanguageSupport: 'High',
    recommendedRuntime: 'vLLM',
  },
];

export function getRecommendedModelForTask(
  task: ModelCandidate['task'],
  hasGpu: boolean,
): ModelCandidate {
  if (task === 'embedding') {
    return EVALUATED_MODELS.find((m) => m.id === 'bge-small-en-v1.5')!;
  }
  if (task === 'classification') {
    return EVALUATED_MODELS.find((m) => m.id === 'qwen-2.5-0.5b-instruct')!;
  }
  if (task === 'rag_presentation') {
    return hasGpu
      ? EVALUATED_MODELS.find((m) => m.id === 'qwen-2.5-7b-instruct')!
      : EVALUATED_MODELS.find((m) => m.id === 'qwen-2.5-1.5b-instruct')!;
  }
  return EVALUATED_MODELS.find((m) => m.id === 'qwen-2-vl-2b-instruct')!;
}

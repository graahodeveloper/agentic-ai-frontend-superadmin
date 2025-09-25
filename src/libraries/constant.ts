const getAIBaseURL = (): string => {
  const environment = process.env.NEXT_PUBLIC_ENV;
  
  switch (environment) {
    case 'demo':
      return process.env.NEXT_PUBLIC_DEMO_AI_BASE_URL || '';
    case 'dev':
      return process.env.NEXT_PUBLIC_DEV_AI_BASE_URL || '';
    default:
      return process.env.NEXT_PUBLIC_DEV_AI_BASE_URL || '';
  }
};

// 2. Update the BASE_URL_AI constant
export const BASE_URL_AI = getAIBaseURL();
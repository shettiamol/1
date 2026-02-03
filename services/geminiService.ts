
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Category } from "../types";

export const isAIThrottled = (): boolean => false;

/**
 * Bulletproof AI instance creator to prevent top-level process.env reference errors.
 */
const getAIInstance = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const getAIInsight = async (transactions: Transaction[], categories: Category[], _forceRefresh = false): Promise<string> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these recent transactions and provide a short, actionable financial insight (max 50 words). 
      Transactions: ${JSON.stringify(transactions.slice(0, 30))}
      Categories: ${JSON.stringify(categories.map(c => ({ id: c.id, name: c.name, limit: c.budgetLimit })))}`,
      config: {
        systemInstruction: "You are a world-class financial advisor for a personal finance app. Be encouraging, concise, and focus on practical saving tips.",
      },
    });
    return response.text || "AI insights are currently settling. Check back soon.";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "AI intelligence is momentarily busy optimizing your data.";
  }
};

export interface ForecastSuggestion {
  categoryId: string;
  suggestedBudget: number;
  reason: string;
  subCategorySuggestions: { subCategoryId: string; suggestedBudget: number; reason: string }[];
}

export const getBudgetForecast = async (transactions: Transaction[], categories: Category[]): Promise<ForecastSuggestion[]> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Suggest budget adjustments based on this data:
      Transactions: ${JSON.stringify(transactions.slice(0, 50))}
      Categories: ${JSON.stringify(categories.map(c => ({ id: c.id, name: c.name, limit: c.budgetLimit, subs: c.subCategories.map(s => ({id: s.id, name: s.name, budget: s.budget})) })))}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              categoryId: { type: Type.STRING },
              suggestedBudget: { type: Type.NUMBER },
              reason: { type: Type.STRING },
              subCategorySuggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    subCategoryId: { type: Type.STRING },
                    suggestedBudget: { type: Type.NUMBER },
                    reason: { type: Type.STRING }
                  },
                  required: ["subCategoryId", "suggestedBudget", "reason"]
                }
              }
            },
            required: ["categoryId", "suggestedBudget", "reason", "subCategorySuggestions"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Forecast Error:", error);
    return [];
  }
};

export const generateGoalVisualization = async (
  prompt: string, 
  aspectRatio: "1:1" | "16:9" | "9:16",
  imageSize: "1K" | "2K" | "4K"
): Promise<string | null> => {
  try {
    const imageAi = getAIInstance();
    const response = await imageAi.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: `A high-quality, inspiring 3D render or photograph representing the following financial goal: ${prompt}. Cinematic lighting, optimistic mood.` }]
      },
      config: {
        imageConfig: { aspectRatio, imageSize }
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    return null;
  }
};

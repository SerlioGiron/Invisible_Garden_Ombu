import axios from "axios";

const API_URL = import.meta.env.VITE_AI_BACKEND_URL;

export const validarPostAI = async (content) => {
  try {
    console.log("Sending content to AI backend:", content);
    const response = await axios.post(`${API_URL}/procesar`, {
      content
    }, {
      timeout: 10000 // 10 second timeout
    });
    console.log("Response from AI backend:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error validating post with AI:", error.message);
    // Return a valid response structure even if AI fails
    // This allows posts to be created even if AI backend is down
    return {
      data: {
        comentario_formalizado: null, // null means validation passed
        categoria: "Opinion",
        tags: []
      }
    };
  }
};

export const validarTituloAI = async (content) => {
  try {
    console.log("Sending title to AI backend:", content);
    const response = await axios.post(`${API_URL}/procesartitulos`, {
      content
    }, {
      timeout: 10000 // 10 second timeout
    });
    console.log("Response from AI backend:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error validating title with AI:", error.message);
    // Return a valid response structure even if AI fails
    // This allows posts to be created even if AI backend is down
    return {
      data: {
        titulo_sugerido: null // null means validation passed
      }
    };
  }
};


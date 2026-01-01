import axios from "axios";
const mock = false;
const API_BASE_URL = "";

const fetchData = async (endpoint: string) => {
   try {
      const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
      const response = await axios.get(url);
      return response.data;
   } catch (error) {
      console.error(`Error fetching data from ${endpoint}:`, error);
      return { success: false, data: null, error: (error as Error).message };
   }
};

export default fetchData;

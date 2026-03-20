const API_URL = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const api = {
  async post(path: string, body: any) {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    
    const contentType = res.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!res.ok) {
      if (isJson) {
        const error = await res.json();
        throw new Error(error.error || 'Request failed');
      } else {
        const text = await res.text();
        console.error('Non-JSON error response:', text);
        throw new Error(`Erro no servidor: ${res.status}`);
      }
    }

    if (!isJson) {
      const text = await res.text();
      console.error('Expected JSON but got:', text);
      throw new Error('Resposta do servidor não é JSON');
    }

    return res.json();
  },

  async get(path: string) {
    const res = await fetch(`${API_URL}${path}`, {
      headers: getHeaders(),
    });
    
    const contentType = res.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!res.ok) {
      if (isJson) {
        const error = await res.json();
        throw new Error(error.error || 'Request failed');
      } else {
        const text = await res.text();
        console.error('Non-JSON error response:', text);
        throw new Error(`Erro no servidor: ${res.status}`);
      }
    }

    if (!isJson) {
      const text = await res.text();
      console.error('Expected JSON but got:', text);
      throw new Error('Resposta do servidor não é JSON');
    }

    return res.json();
  },

  async delete(path: string) {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    const contentType = res.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!res.ok) {
      if (isJson) {
        const error = await res.json();
        throw new Error(error.error || 'Request failed');
      } else {
        const text = await res.text();
        console.error('Non-JSON error response:', text);
        throw new Error(`Erro no servidor: ${res.status}`);
      }
    }

    if (!isJson) {
      const text = await res.text();
      console.error('Expected JSON but got:', text);
      throw new Error('Resposta do servidor não é JSON');
    }

    return res.json();
  },
};

const API_URL = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res: Response) => {
  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  if (!res.ok) {
    if (isJson) {
      const error = await res.json();
      throw new Error(error.error || 'Requisição falhou');
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
};

export const api = {
  async post(path: string, body: any) {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async put(path: string, body: any) {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async get(path: string) {
    const res = await fetch(`${API_URL}${path}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async delete(path: string) {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

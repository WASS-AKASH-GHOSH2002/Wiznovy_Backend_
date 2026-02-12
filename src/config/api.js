let API_BASE_URL;

const env = import.meta.env.MODE;

if (env === 'dev') {
  API_BASE_URL = import.meta.env.VITE_API_URL ;
} else if (env === 'qa') {
  API_BASE_URL = import.meta.env.VITE_API_URL;
} else if (env === 'prod') {
  API_BASE_URL = import.meta.env.VITE_API_URL;
} else {
  API_BASE_URL = import.meta.env.VITE_API_URL;
}

export { API_BASE_URL };
export default API_BASE_URL;
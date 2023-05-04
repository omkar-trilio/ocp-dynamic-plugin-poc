import { useState, useEffect } from 'react';
import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk';

const useFetch = (url, dependencies = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await consoleFetchJSON(url);
      setData(response.items);
    } catch (e) {
      console.error(e);
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { data, loading, error };
};

export default useFetch;

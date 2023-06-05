import * as React from 'react';
import {
  Form,
  FormGroup,
  TextInput,
  ActionGroup,
  Button,
  FormSelect,
  FormSelectOption,
  Alert,
} from '@patternfly/react-core';
import { useForm, Controller } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk';
import useFetch from '../../hooks/useFetch';

const BackupConfigForm: React.FunctionComponent = () => {
  const { data: namespaces } = useFetch('/api/kubernetes/api/v1/namespaces');
  const { data: managedClusters } = useFetch(
    '/api/kubernetes/apis/cluster.open-cluster-management.io/v1/managedclusters',
  );
  const history = useHistory();
  const [apiError, setApiError] = React.useState('');

  const { control, handleSubmit, setValue } = useForm({
    defaultValues: {
      sourceCluster: '',
      secretKey: '',
      accessKey: '',
      bucketName: '',
      region: '',
      backupNamespace: '',
    },
  });

  React.useEffect(() => {
    if (namespaces?.length) {
      setValue('backupNamespace', namespaces[0].metadata.name);
    }

    if (managedClusters?.length) {
      setValue('sourceCluster', managedClusters[0].metadata.name);
    }
  }, [namespaces, managedClusters]);

  const onSubmit = async (data) => {
    try {
      // Add protected-by=triliovault label to the source cluster
      await consoleFetchJSON.put(
        `/api/kubernetes/apis/cluster.open-cluster-management.io/v1/managedclusters/${data.sourceCluster}`,
        {
          ...managedClusters[0],
          metadata: {
            ...managedClusters[0].metadata,
            labels: {
              ...managedClusters[0].metadata.labels,
              'protected-by': 'triliovault',
            },
          },
        },
      );

      // Create configmap
      await consoleFetchJSON.post(
        '/api/kubernetes/api/v1/namespaces/default/configmaps',
        {
          apiVersion: 'v1',
          kind: 'ConfigMap',
          metadata: {
            name: `aws-s3-configmap`,
            namespace: 'default',
          },
          data: {
            bucketName: data.bucketName,
            region: data.region,
            thresholdCapacity: '100Gi',
            backupNS: data.backupNamespace,
          },
          binaryData: {},
          immutable: false,
        },
      );

      // Create secret
      await consoleFetchJSON.post(
        '/api/kubernetes/api/v1/namespaces/default/secrets',
        {
          metadata: {
            namespace: 'default',
            name: `aws-s3-secret`,
          },
          apiVersion: 'v1',
          data: {
            accessKey: btoa(data.accessKey),
            secretKey: btoa(data.secretKey),
          },
          kind: 'Secret',
          type: 'Opaque',
        },
      );

      // Redirect to ACM on success
      history.push('/multicloud/governance/policies/create');
    } catch (e) {
      console.error(e);
      setApiError(e?.message || 'Something went wrong! Please try again.');
    }
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="sourceCluster"
        control={control}
        render={({ field }) => (
          <FormGroup label="Source Cluster" fieldId="source-cluster">
            <FormSelect
              id="source-cluster"
              aria-label="Source Cluster"
              {...field}
            >
              {managedClusters.map((cluster) => (
                <FormSelectOption
                  key={cluster.metadata.uid}
                  value={cluster.metadata.name}
                  label={cluster.metadata.name}
                />
              ))}
            </FormSelect>
          </FormGroup>
        )}
      />
      <Controller
        name="secretKey"
        control={control}
        render={({ field }) => (
          <FormGroup label="AWS Secret Key" fieldId="aws-secret-key">
            <TextInput id="aws-secret-key" {...field} />
          </FormGroup>
        )}
      />
      <Controller
        name="accessKey"
        control={control}
        render={({ field }) => (
          <FormGroup label="AWS Access Key" fieldId="aws-access-key">
            <TextInput id="aws-access-key" {...field} />
          </FormGroup>
        )}
      />
      <Controller
        name="bucketName"
        control={control}
        render={({ field }) => (
          <FormGroup label="AWS S3 Bucket Name" fieldId="aws-bucket-name">
            <TextInput id="aws-bucket-name" {...field} />
          </FormGroup>
        )}
      />
      <Controller
        name="region"
        control={control}
        render={({ field }) => (
          <FormGroup label="Region" fieldId="aws-region">
            <TextInput id="aws-region" {...field} />
          </FormGroup>
        )}
      />
      <Controller
        name="backupNamespace"
        control={control}
        render={({ field }) => (
          <FormGroup label="Backup Namespace" fieldId="backup-namespace">
            <FormSelect
              id="backup-namespace"
              aria-label="Backup Namespace"
              {...field}
            >
              {namespaces.map((ns) => (
                <FormSelectOption
                  key={ns.metadata.uid}
                  value={ns.metadata.name}
                  label={ns.metadata.name}
                />
              ))}
            </FormSelect>
          </FormGroup>
        )}
      />
      {apiError ? <Alert variant="danger" title={apiError} /> : null}
      <ActionGroup>
        <Button type="submit" variant="primary">
          Submit
        </Button>
      </ActionGroup>
    </Form>
  );
};

export default BackupConfigForm;

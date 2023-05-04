import * as React from 'react';
import Helmet from 'react-helmet';
import { Grid, GridItem, Page, PageSection } from '@patternfly/react-core';
import BackupConfigForm from './BackupConfigForm';
import './NamespaceBackup.css';

export default function NamespaceBackup() {
  return (
    <>
      <Helmet>
        <title data-test="ns-backup-dynamic-plugin">
          Setup Namespace Based Backup
        </title>
      </Helmet>
      <Page>
        <PageSection>
          <Grid>
            <GridItem span={6}>
              <BackupConfigForm />
            </GridItem>
          </Grid>
        </PageSection>
      </Page>
    </>
  );
}

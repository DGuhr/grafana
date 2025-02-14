import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { FormEvent } from 'react';
import { of } from 'rxjs';
import { MockDataSourceApi } from 'test/mocks/datasource_srv';

import {
  LoadingState,
  PanelData,
  getDefaultTimeRange,
  toDataFrame,
  FieldType,
  VariableSupportType,
} from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { setRunRequest } from '@grafana/runtime';
import { VariableRefresh, VariableSort } from '@grafana/schema';
import { mockDataSource } from 'app/features/alerting/unified/mocks';
import { LegacyVariableQueryEditor } from 'app/features/variables/editor/LegacyVariableQueryEditor';

import { QueryVariableEditorForm } from './QueryVariableForm';

const defaultDatasource = mockDataSource({
  name: 'Default Test Data Source',
  type: 'test',
});

const promDatasource = mockDataSource({
  name: 'Prometheus',
  type: 'prometheus',
});

jest.mock('@grafana/runtime/src/services/dataSourceSrv', () => ({
  ...jest.requireActual('@grafana/runtime/src/services/dataSourceSrv'),
  getDataSourceSrv: () => ({
    get: async () => ({
      ...defaultDatasource,
      variables: {
        getType: () => VariableSupportType.Custom,
        query: jest.fn(),
        editor: jest.fn().mockImplementation(LegacyVariableQueryEditor),
      },
    }),
    getList: () => [defaultDatasource, promDatasource],
    getInstanceSettings: () => ({ ...defaultDatasource }),
  }),
}));

const runRequestMock = jest.fn().mockReturnValue(
  of<PanelData>({
    state: LoadingState.Done,
    series: [
      toDataFrame({
        fields: [{ name: 'text', type: FieldType.string, values: ['val1', 'val2', 'val11'] }],
      }),
    ],
    timeRange: getDefaultTimeRange(),
  })
);

setRunRequest(runRequestMock);

describe('QueryVariableEditorForm', () => {
  const mockOnDataSourceChange = jest.fn();
  const mockOnQueryChange = jest.fn();
  const mockOnLegacyQueryChange = jest.fn();
  const mockOnRegExChange = jest.fn();
  const mockOnSortChange = jest.fn();
  const mockOnRefreshChange = jest.fn();
  const mockOnMultiChange = jest.fn();
  const mockOnIncludeAllChange = jest.fn();
  const mockOnAllValueChange = jest.fn();

  const defaultProps = {
    datasource: new MockDataSourceApi(promDatasource.name, undefined, promDatasource.meta),
    onDataSourceChange: mockOnDataSourceChange,
    query: 'my-query',
    onQueryChange: mockOnQueryChange,
    onLegacyQueryChange: mockOnLegacyQueryChange,
    timeRange: getDefaultTimeRange(),
    VariableQueryEditor: LegacyVariableQueryEditor,
    regex: '.*',
    onRegExChange: mockOnRegExChange,
    sort: VariableSort.alphabeticalAsc,
    onSortChange: mockOnSortChange,
    refresh: VariableRefresh.onDashboardLoad,
    onRefreshChange: mockOnRefreshChange,
    isMulti: true,
    onMultiChange: mockOnMultiChange,
    includeAll: true,
    onIncludeAllChange: mockOnIncludeAllChange,
    allValue: 'custom all value',
    onAllValueChange: mockOnAllValueChange,
  };

  function setup(props?: React.ComponentProps<typeof QueryVariableEditorForm>) {
    return {
      renderer: render(<QueryVariableEditorForm {...defaultProps} {...props} />),
      user: userEvent.setup(),
    };
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the component with initializing the components correctly', () => {
    const {
      renderer: { getByTestId, getByRole },
    } = setup();
    const dataSourcePicker = getByTestId(selectors.components.DataSourcePicker.inputV2);
    //const queryEditor = getByTestId('query-editor');
    const regexInput = getByTestId(
      selectors.pages.Dashboard.Settings.Variables.Edit.QueryVariable.queryOptionsRegExInputV2
    );
    const sortSelect = getByTestId(
      selectors.pages.Dashboard.Settings.Variables.Edit.QueryVariable.queryOptionsSortSelectV2
    );
    const refreshSelect = getByTestId(
      selectors.pages.Dashboard.Settings.Variables.Edit.QueryVariable.queryOptionsRefreshSelectV2
    );

    const multiSwitch = getByTestId(
      selectors.pages.Dashboard.Settings.Variables.Edit.General.selectionOptionsMultiSwitch
    );
    const includeAllSwitch = getByTestId(
      selectors.pages.Dashboard.Settings.Variables.Edit.General.selectionOptionsIncludeAllSwitch
    );
    const allValueInput = getByTestId(
      selectors.pages.Dashboard.Settings.Variables.Edit.General.selectionOptionsCustomAllInput
    );

    expect(dataSourcePicker).toBeInTheDocument();
    expect(dataSourcePicker.getAttribute('placeholder')).toBe('Default Test Data Source');
    expect(regexInput).toBeInTheDocument();
    expect(regexInput).toHaveValue('.*');
    expect(sortSelect).toBeInTheDocument();
    expect(sortSelect).toHaveTextContent('Alphabetical (asc)');
    expect(refreshSelect).toBeInTheDocument();
    expect(getByRole('radio', { name: 'On dashboard load' })).toBeChecked();
    expect(multiSwitch).toBeInTheDocument();
    expect(multiSwitch).toBeChecked();
    expect(includeAllSwitch).toBeInTheDocument();
    expect(includeAllSwitch).toBeChecked();
    expect(allValueInput).toBeInTheDocument();
    expect(allValueInput).toHaveValue('custom all value');
  });

  it('should call onDataSourceChange when changing the datasource', async () => {
    const {
      renderer: { getByTestId },
    } = setup();
    const dataSourcePicker = getByTestId(selectors.components.DataSourcePicker.inputV2);
    await userEvent.click(dataSourcePicker);
    await userEvent.click(screen.getByText(/prometheus/i));

    expect(mockOnDataSourceChange).toHaveBeenCalledTimes(1);
    expect(mockOnDataSourceChange).toHaveBeenCalledWith(promDatasource, undefined);
  });

  it('should call onQueryChange when changing the query', async () => {
    const {
      renderer: { getByTestId },
    } = setup();
    const queryEditor = getByTestId(
      selectors.pages.Dashboard.Settings.Variables.Edit.QueryVariable.queryOptionsQueryInput
    );

    await waitFor(async () => {
      await userEvent.type(queryEditor, '-new');
      await userEvent.tab();
    });

    expect(mockOnLegacyQueryChange).toHaveBeenCalledTimes(1);
    expect(mockOnLegacyQueryChange).toHaveBeenCalledWith('my-query-new', expect.anything());
  });

  it('should call onRegExChange when changing the regex', async () => {
    const {
      renderer: { getByTestId },
    } = setup();
    const regexInput = getByTestId(
      selectors.pages.Dashboard.Settings.Variables.Edit.QueryVariable.queryOptionsRegExInputV2
    );
    await userEvent.type(regexInput, '{backspace}?');
    await userEvent.tab();
    expect(mockOnRegExChange).toHaveBeenCalledTimes(1);
    expect(
      ((mockOnRegExChange.mock.calls[0][0] as FormEvent<HTMLTextAreaElement>).target as HTMLTextAreaElement).value
    ).toBe('.?');
  });

  it('should call onSortChange when changing the sort', async () => {
    const {
      renderer: { getByTestId },
    } = setup();
    const sortSelect = getByTestId(
      selectors.pages.Dashboard.Settings.Variables.Edit.QueryVariable.queryOptionsSortSelectV2
    );
    await userEvent.click(sortSelect); // open the select
    const anotherOption = await screen.getByText('Alphabetical (desc)');
    await userEvent.click(anotherOption);

    expect(mockOnSortChange).toHaveBeenCalledTimes(1);
    expect(mockOnSortChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: VariableSort.alphabeticalDesc }),
      expect.anything()
    );
  });

  it('should call onRefreshChange when changing the refresh', async () => {
    const {
      renderer: { getByTestId },
    } = setup();
    const refreshSelect = getByTestId(
      selectors.pages.Dashboard.Settings.Variables.Edit.QueryVariable.queryOptionsRefreshSelectV2
    );
    await userEvent.click(refreshSelect); // open the select
    const anotherOption = await screen.getByText('On time range change');
    await userEvent.click(anotherOption);

    expect(mockOnRefreshChange).toHaveBeenCalledTimes(1);
    expect(mockOnRefreshChange).toHaveBeenCalledWith(VariableRefresh.onTimeRangeChanged);
  });

  it('should call onMultiChange when changing the multi switch', async () => {
    const {
      renderer: { getByTestId },
    } = setup();
    const multiSwitch = getByTestId(
      selectors.pages.Dashboard.Settings.Variables.Edit.General.selectionOptionsMultiSwitch
    );
    await userEvent.click(multiSwitch);
    expect(mockOnMultiChange).toHaveBeenCalledTimes(1);
    expect(
      (mockOnMultiChange.mock.calls[0][0] as FormEvent<HTMLInputElement>).target as HTMLInputElement
    ).toBeChecked();
  });

  it('should call onIncludeAllChange when changing the include all switch', async () => {
    const {
      renderer: { getByTestId },
    } = setup();
    const includeAllSwitch = getByTestId(
      selectors.pages.Dashboard.Settings.Variables.Edit.General.selectionOptionsIncludeAllSwitch
    );
    await userEvent.click(includeAllSwitch);
    expect(mockOnIncludeAllChange).toHaveBeenCalledTimes(1);
    expect(
      (mockOnIncludeAllChange.mock.calls[0][0] as FormEvent<HTMLInputElement>).target as HTMLInputElement
    ).toBeChecked();
  });

  it('should call onAllValueChange when changing the all value', async () => {
    const {
      renderer: { getByTestId },
    } = setup();
    const allValueInput = getByTestId(
      selectors.pages.Dashboard.Settings.Variables.Edit.General.selectionOptionsCustomAllInput
    );
    await userEvent.type(allValueInput, ' and another value');
    await userEvent.tab();
    expect(mockOnAllValueChange).toHaveBeenCalledTimes(1);
    expect(
      ((mockOnAllValueChange.mock.calls[0][0] as FormEvent<HTMLInputElement>).target as HTMLInputElement).value
    ).toBe('custom all value and another value');
  });
});

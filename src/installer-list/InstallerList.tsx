import React from 'react'

import { Installer } from '../api-client/models'
import classes from './InstallerList.module.css'
import { CodeFilter, CreatedDateFilter, InstallerFilters, IsActiveFilter, NameFilter, PhoneFilter, filterInstallerList } from './Filters'
import { TBody, THead, Table, Td, TdText, Th, Tr } from '../ui-components/table/Table'
import { formatDate } from '../utils/formatDate'

export function InstallerList({
  data
}: {
  data: Installer[]
}) {
  const [filters, setFilters] = React.useState<InstallerFilters>({})
  const hasFilters = React.useMemo(() => {
    return Object.values(filters).length
  }, [filters])

  const installerListData = filterInstallerList(data, filters)

  return (
    <div>
      <h2 className={classes['page-title']}>Installer List, {installerListData.length} {hasFilters ? 'filtered ' : ''}results</h2>
      <Table gridClass={classes['table-grid']}>
        <THead>
          <Tr>
            <Th><TdText>Code</TdText></Th>
            <Th><TdText>Name</TdText></Th>
            <Th><TdText>Phone</TdText></Th>
            <Th><TdText>Is active</TdText></Th>
            <Th><TdText>Created at</TdText></Th>
            <Th></Th>
          </Tr>
          <Tr>
            <Th><CodeFilter setFilters={setFilters} /></Th>
            <Th><NameFilter setFilters={setFilters} /></Th>
            <Th><PhoneFilter setFilters={setFilters} /></Th>
            <Th><IsActiveFilter setFilters={setFilters} /></Th>
            <Th><CreatedDateFilter setFilters={setFilters} /></Th>
            <Th></Th>
          </Tr>
        </THead>
        <TBody>
          {installerListData.map((data) => (
            <InstallerRow
              key={data.id}
              data={data}
            />
          ))}
        </TBody>
      </Table>
    </div>
  )
}

function InstallerRow({ data }: { data: Installer }) {
  return (
    <Tr>
      <Td><TdText>{data.code}</TdText></Td>
      <Td><TdText>{data.name}</TdText></Td>
      <Td><TdText>{data.phone}</TdText></Td>
      <Td><TdText>{data.isActive}</TdText></Td>
      <Td><TdText>{formatDate(data.createdAt)}</TdText></Td>
      <Td></Td>
    </Tr>
  )
}

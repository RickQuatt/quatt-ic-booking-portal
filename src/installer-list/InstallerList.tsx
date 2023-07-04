import React from 'react'

import { Installer } from '../api-client/models'
import classes from './InstallerList.module.css'
import { CodeFilter, CreatedDateFilter, InstallerFilters, IsActiveFilter, NameFilter, PhoneFilter, filterInstallerList } from './Filters'
import { TBody, THead, Table, Td, TdText, Th, Tr } from '../ui-components/table/Table'
import { formatDate } from '../utils/formatDate'
import { Button } from '../ui-components/button/Button'
import { InstallerModal, OpenInstallerModal, useInstallerModalState } from './InstallerModal'

export function InstallerList({
  data,
  refetch
}: {
  data: Installer[]
  refetch: () => void;
}) {
  const [filters, setFilters] = React.useState<InstallerFilters>({})
  const hasFilters = React.useMemo(() => {
    return Object.values(filters).length
  }, [filters])

  const installerListData = filterInstallerList(data, filters)

  const [modalId, setModalId] = React.useState<string | undefined>()
  const {
    isOpen: isInstallerModalOpen,
    open: openInstallerModal,
    close: closeInstallerModal,
    installerId,
    data: installerData
  } = useInstallerModalState();

  return (
    <div className={classes.page}>
      <InstallerModal
        isOpen={isInstallerModalOpen}
        closeModal={closeInstallerModal}
        installerId={installerId}
        installerData={installerData}
        // when adding a new installer, we need to refetch to make sure it's shown in the table afterwards
        onSuccess={refetch}
      />
      <h2 className={classes['page-title']}>Installer List, {installerListData.length} {hasFilters ? 'filtered ' : ''}results</h2>
      <Table gridClass={classes['table-grid']}>
        <THead>
          <Tr>
            <Th><TdText>Code</TdText></Th>
            <Th><TdText>Name</TdText></Th>
            <Th><TdText>Phone</TdText></Th>
            <Th><TdText>Is active</TdText></Th>
            <Th><TdText>Created at</TdText></Th>
            <Th>
              <Button onClick={() => openInstallerModal()}>
                Add Installer
              </Button>
            </Th>
          </Tr>
          <Tr>
            <Th><CodeFilter setFilters={setFilters} /></Th>
            <Th><NameFilter setFilters={setFilters} /></Th>
            <Th><PhoneFilter setFilters={setFilters} /></Th>
            <Th><IsActiveFilter setFilters={setFilters} /></Th>
            <Th><CreatedDateFilter setFilters={setFilters} /></Th>
            <Th>
            </Th>
          </Tr>
        </THead>
        <TBody>
          {installerListData.map((data) => (
            <InstallerRow
              key={data.id}
              data={data}
              openInstallerModal={openInstallerModal}
            />
          ))}
        </TBody>
      </Table>
    </div>
  )
}

function InstallerRow({ data, openInstallerModal }: { data: Installer, openInstallerModal: OpenInstallerModal }) {
  return (
    <Tr>
      <Td><TdText>{data.code}</TdText></Td>
      <Td><TdText>{data.name}</TdText></Td>
      <Td><TdText>{data.phone}</TdText></Td>
      <Td><TdText>{data.isActive}</TdText></Td>
      <Td><TdText>{formatDate(data.createdAt)}</TdText></Td>
      <Td>
        <Button onClick={() => openInstallerModal({ installerId: data.id, data })}>
          Edit
        </Button>
      </Td>
    </Tr>
  )
}

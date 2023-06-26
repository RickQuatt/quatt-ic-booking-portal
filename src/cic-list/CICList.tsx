import React from 'react'
import { Link } from 'wouter'

import classes from './CICList.module.css'
import {
   CICFilters,
    CableConnectionStatusFilter,
    CreatedDateFilter,
    IDFilter,
    LTEConnectionStatusFilter,
    LastConnectionStatusFilter,
    OrderNumberFilter,
    SupervisoryControlModeFilter,
    WifiConnectionStatusFilter,
    filterCICList
   } from './Filters'
import { ButtonLink } from '../ui-components/button/Button'
import { AdminCic } from '../api-client/models'
import { formatDate, formatDateDistance } from '../utils/formatDate'
import { getGrafanaLink, getMenderLink } from '../cic-detail/getLinks'
import classNames from 'classnames'

export function CICList({
  data
}: {
  data: AdminCic[]
}) {
  const [filters, setFilters] = React.useState<CICFilters>({})
  const hasFilters = React.useMemo(() => {
    return Object.values(filters).length
  }, [filters])

  const CICListData = filterCICList(data, filters)

  return (
    <div>
      <h2>CIC List, {CICListData.length} {hasFilters ? 'filtered ' : ''}results</h2>
      <table className={classes.table}>
        <thead className={classes.thead}>
          <tr className={`${classes.tr} ${classes['main-table-header']}`}>
            <Th>ID</Th>
            <Th>Cable connection status</Th>
            <Th>Wifi connection status</Th>
            <Th>LTE connection status</Th>
            <Th>Supervisory control mode</Th>
            <Th>Order number</Th>
            <Th>Created at</Th>
            <Th>Last connection status updated at</Th>
            <Th>Mender</Th>
            <Th>Grafana</Th>
            <Th>Details</Th>
          </tr>
          <tr className={`${classes.tr}`}>
            <Th><IDFilter setFilters={setFilters} /></Th>
            <Th><CableConnectionStatusFilter setFilters={setFilters} /></Th>
            <Th><WifiConnectionStatusFilter setFilters={setFilters} /></Th>
            <Th><LTEConnectionStatusFilter setFilters={setFilters} /></Th>
            <Th><SupervisoryControlModeFilter setFilters={setFilters} /></Th>
            <Th><OrderNumberFilter setFilters={setFilters} /></Th>
            <Th><CreatedDateFilter setFilters={setFilters} /></Th>
            <Th><LastConnectionStatusFilter setFilters={setFilters} /></Th>
            <Th></Th>
            <Th></Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody className={classes.tbody}>
          {CICListData.map((cicEntry) => (
            <CICRow
              key={cicEntry.id}
              cicEntry={cicEntry}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Th(props: React.PropsWithChildren) {
  return (
    <th className={classes.th} {...props} />
  )
}

function Td(props: React.PropsWithChildren<{
  noSidePadding?: boolean;
}>) {
  return (
    <td className={classNames(classes.td, props.noSidePadding && classes['no-side-padding'])} {...props} />
  )
}

function CICRow({ cicEntry }: { cicEntry: AdminCic }) {
  return (
    <tr className={classes.tr}>
      <Td>{cicEntry.id}</Td>
      <Td>{cicEntry.cableConnectionStatus}</Td>
      <Td>{cicEntry.wifiConnectionStatus}</Td>
      <Td>{cicEntry.lteConnectionStatus}</Td>
      <Td>{cicEntry.supervisoryControlMode}</Td>
      <Td>{cicEntry.orderNumber}</Td>
      <Td>{formatDate(cicEntry.createdAt)}</Td>
      <Td>{formatDateDistance(cicEntry.lastConnectionStatusUpdatedAt)}</Td>
      <Td noSidePadding>
        <ButtonLink
          href={getMenderLink(cicEntry.id)}
          target='_blank'
        >Mender</ButtonLink>
      </Td>
      <Td noSidePadding>
        <ButtonLink
          href={getGrafanaLink(cicEntry.id)}
          target='_blank'
        >Grafana</ButtonLink>
      </Td>
      <Td noSidePadding>
        <Link href={`/${cicEntry.id}`}>
          <ButtonLink>Detail</ButtonLink>
        </Link>
      </Td>
    </tr>
  )
}
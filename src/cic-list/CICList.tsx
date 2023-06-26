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
            <Th><TdText>ID</TdText></Th>
            <Th><TdText>Cable connection status</TdText></Th>
            <Th><TdText>Wifi connection status</TdText></Th>
            <Th><TdText>LTE connection status</TdText></Th>
            <Th><TdText>Supervisory control mode</TdText></Th>
            <Th><TdText>Order number</TdText></Th>
            <Th><TdText>Created at</TdText></Th>
            <Th><TdText>Last connection status updated at</TdText></Th>
            <Th><TdText>Mender</TdText></Th>
            <Th><TdText>Grafana</TdText></Th>
            <Th><TdText>Details</TdText></Th>
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
    <th className={classes.th}>
      {props.children}
    </th>
  )
}

function Td(props: React.PropsWithChildren<{
  noSidePadding?: boolean;
}>) {
  return (
    <td className={classes.td}>
      {props.children}
    </td>
  )
}


function TdText(props: React.PropsWithChildren) {
  return (
    <span className={classes['tdh-text']}>{props.children}</span>
  )
}

function CICRow({ cicEntry }: { cicEntry: AdminCic }) {
  return (
    <tr className={classes.tr}>
      <Td><TdText>{cicEntry.id}</TdText></Td>
      <Td><TdText>{cicEntry.cableConnectionStatus}</TdText></Td>
      <Td><TdText>{cicEntry.wifiConnectionStatus}</TdText></Td>
      <Td><TdText>{cicEntry.lteConnectionStatus}</TdText></Td>
      <Td><TdText>{cicEntry.supervisoryControlMode}</TdText></Td>
      <Td><TdText>{cicEntry.orderNumber}</TdText></Td>
      <Td><TdText>{formatDate(cicEntry.createdAt)}</TdText></Td>
      <Td><TdText>{formatDateDistance(cicEntry.lastConnectionStatusUpdatedAt)}</TdText></Td>
      <Td>
        <ButtonLink
          href={getMenderLink(cicEntry.id)}
          target='_blank'
        >Mender</ButtonLink>
      </Td>
      <Td>
        <ButtonLink
          href={getGrafanaLink(cicEntry.id)}
          target='_blank'
        >Grafana</ButtonLink>
      </Td>
      <Td>
        <Link href={`/${cicEntry.id}`}>
          <ButtonLink>Detail</ButtonLink>
        </Link>
      </Td>
    </tr>
  )
}
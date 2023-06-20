import React from 'react'
import { formatDistance } from 'date-fns'
import { Link } from 'wouter'

import classes from './CICList.module.css'
import { CICFilters, CableConnectionStatusFilter, CreatedDateFilter, IDFilter, LTEConnectionStatusFilter, LastConnectionStatusFilter, OrderNumberFilter, SupervisoryControlModeFilter, WifiConnectionStatusFilter, filterCICList } from './Filters'
import { CICEntry, CICEntryList } from '../types'
import { ButtonLink } from '../Button/Button'

export function CICList({
  data
}: {
  data: CICEntryList
}) {
  const [filters, setFilters] = React.useState<CICFilters>({})
  const hasFilters = React.useMemo(() => {
    return Object.values(filters).length
  }, [filters])

  const CICListData = filterCICList(data, filters)

  return (
    <>
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
          {CICListData.map((cicEntry: CICEntry) => (
            <CICRow
              key={cicEntry.id}
              cicEntry={cicEntry}
            />
          ))}
        </tbody>
      </table>
    </>
  )
}

function Th(props: React.PropsWithChildren) {
  return (
    <th className={classes.th} {...props} />
  )
}

function Td(props: React.PropsWithChildren) {
  return (
    <td className={classes.td} {...props} />
  )
}

function getMenderLink(id: string) {
  return `https://hosted.mender.io/ui/devices/accepted?sort=system:updated_ts:desc&id=${id}`
}

function getGrafanaLink(id: string) {
  return `https://g-736ff2fef7.grafana-workspace.eu-west-1.amazonaws.com/d/HaR0DRlVk/production?orgId=1&from=now-6h&to=now&var-CICuuid=${id}`
}

function CICRow({ cicEntry }: { cicEntry: CICEntry }) {
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

// as in 2023-05-23 
function formatDate(isoString: string) {
  return isoString.substring(0, 10)
}

// as in "x minutes ago"
function formatDateDistance(isoString: string) {
  return formatDistance(
    new Date(isoString),
    new Date(),
    { addSuffix: true }
  )
}
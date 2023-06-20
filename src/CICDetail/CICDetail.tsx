import React from 'react'

import classes from './CICDetail.module.css'
import { CICEntryDetail } from '../types'

interface CICDetailProps {
  data: CICEntryDetail
}

export function CICDetail({ data }: CICDetailProps) {
  const cicData = data

  return (
    <div className={classes['detail-list']}>
      <DetailField>
        <DetailFieldTitle>ID</DetailFieldTitle>
        <DetailFieldContent>{cicData.id}</DetailFieldContent>
      </DetailField>
      <DetailField>
        <DetailFieldTitle>Order number</DetailFieldTitle>
        <DetailFieldContent>{cicData.orderNumber}</DetailFieldContent>
      </DetailField>
      <DetailField>
        <DetailFieldTitle>Quatt build</DetailFieldTitle>
        <DetailFieldContent>{cicData.quattBuild}</DetailFieldContent>
      </DetailField>
      <DetailField>
        <DetailFieldTitle>Last connection status updated at</DetailFieldTitle>
        <DetailFieldContent>{cicData.lastConnectionStatusUpdatedAt}</DetailFieldContent>
      </DetailField>
    </div>
  )
}

function DetailField({ children }: React.PropsWithChildren) {
  return (
    <div className={classes['detail-field']}>
      { children }
    </div>
  )
}

function DetailFieldTitle({ children }: React.PropsWithChildren) {
  return (
    <span className={classes['detail-field-title']}>
      { children }
    </span>
  )
}

function DetailFieldContent({ children }: React.PropsWithChildren) {
  return (
    <span className={classes['detail-field-content']}>
      { children }
    </span>
  )
}
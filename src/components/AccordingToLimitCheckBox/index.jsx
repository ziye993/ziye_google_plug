import React from 'react';
import { Checkbox } from 'antd';


export const AccordingToLimitCheckBox = (props) => {
  const { max = Number.MAX_SAFE_INTEGER, min = 0, value = props.min || 0, onChange } = props;
  const indeterminate = value > min && value < max;
  const checked = value === max;
  return <Checkbox indeterminate={indeterminate} checked={checked} onChange={onChange} />
}
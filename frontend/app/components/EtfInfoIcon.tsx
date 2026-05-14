"use client";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { IconButton, Tooltip } from "@mui/material";
import { getEtfDescription } from "../lib/etfInfo";

type Props = {
  ticker: string;
};

export function EtfInfoIcon({ ticker }: Props) {
  return (
    <Tooltip
      placement="top"
      title={<span style={{ lineHeight: 1.5 }}>{getEtfDescription(ticker)}</span>}
    >
      <IconButton size="small" sx={{ color: "grey.500", p: 0.25 }}>
        <InfoOutlinedIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Tooltip>
  );
}


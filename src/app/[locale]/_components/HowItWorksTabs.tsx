"use client";

import { Tabs } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { HowItWorksColumn } from "./HowItWorksColumn";

interface ColumnData {
  eyebrow: string;
  tabLabel: string;
  headline: string;
  steps: string[];
  ctaLabel: string;
  ctaHref: string;
  colorPalette: "primary" | "secondary" | "accent";
  icon: ReactNode;
}

export function HowItWorksTabs({
  owner,
  resident,
  caretaker,
}: {
  owner: ColumnData;
  resident: ColumnData;
  caretaker: ColumnData;
}) {
  return (
    <Tabs.Root defaultValue="owner" fitted>
      <Tabs.List>
        <Tabs.Trigger value="owner" minH="10" whiteSpace="nowrap">
          {owner.tabLabel}
        </Tabs.Trigger>
        <Tabs.Trigger value="resident" minH="10" whiteSpace="nowrap">
          {resident.tabLabel}
        </Tabs.Trigger>
        <Tabs.Trigger value="caretaker" minH="10" whiteSpace="nowrap">
          {caretaker.tabLabel}
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="owner" pt={5}>
        <HowItWorksColumn {...owner} />
      </Tabs.Content>
      <Tabs.Content value="resident" pt={5}>
        <HowItWorksColumn {...resident} />
      </Tabs.Content>
      <Tabs.Content value="caretaker" pt={5}>
        <HowItWorksColumn {...caretaker} />
      </Tabs.Content>
    </Tabs.Root>
  );
}

"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function ComboboxCompanyForm({ data, selectId }) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(() =>
    selectId != null ? String(selectId) : ""
  );

  React.useEffect(() => {
    setValue(selectId != null ? String(selectId) : "");
  }, [selectId]);

  return (
    <Popover open={open} onOpenChange={setOpen} className="w-full">
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {(() => {
            const selected = Array.isArray(data)
              ? data.find((item) => String(item.id) === value)
              : undefined;
            return selected?.name ?? "Select ...";
          })()}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search..." className="h-9" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {data.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  keywords={[String(item.id)]}
                  onSelect={() => {
                    const newValue = String(item.id);
                    setValue(newValue === value ? "" : newValue);
                    setOpen(false);
                  }}
                >
                  <span>{item?.phone_code}</span> {item.name}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === String(item.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

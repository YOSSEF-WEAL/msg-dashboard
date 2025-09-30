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

export default function ComboboxCompanyForm({
  name,
  data,
  selectId,
  disabled,
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(() =>
    selectId != null ? String(selectId) : ""
  );

  React.useEffect(() => {
    setValue(selectId != null ? String(selectId) : "");
  }, [selectId]);

  const selectedItem = Array.isArray(data)
    ? data.find((item) => String(item.id) === value)
    : undefined;

  return (
    <>
      <input type="hidden" name={name} value={value} />

      <Popover open={open} onOpenChange={setOpen} className="w-full">
        <PopoverTrigger asChild disabled={disabled}>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedItem?.name ?? "Select ..."}
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
                    className={"cursor-pointer"}
                    onSelect={() => {
                      const newValue = String(item.id);
                      setValue(newValue);
                      setOpen(false);
                    }}
                  >
                    {item?.phone_code ? (
                      <span className="mr-2">{item.phone_code}</span>
                    ) : null}
                    {item.name}
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
    </>
  );
}

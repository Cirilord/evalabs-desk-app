import { CheckIcon, ChevronsUpDownIcon, PlusIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import type { LibraryComboboxProps } from './types';

const suggestedLibraries = [
  'beautifulsoup4',
  'httpx',
  'numpy',
  'openpyxl',
  'pandas',
  'pydantic',
  'requests',
];

export function LibraryCombobox(props: LibraryComboboxProps) {
  const { libraries, onChange } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim();
  const filteredLibraries = suggestedLibraries.filter(
    (library) =>
      library.includes(normalizedQuery.toLowerCase()) &&
      !libraries.some((selectedLibrary) => selectedLibrary.name.toLowerCase() === library)
  );
  const canAddQuery =
    Boolean(normalizedQuery) &&
    !libraries.some((library) => library.name.toLowerCase() === normalizedQuery.toLowerCase());

  function addLibrary(name: string) {
    onChange([...libraries, { name, version: 'latest' }]);
    setIsOpen(false);
    setQuery('');
  }

  function removeLibrary(name: string) {
    onChange(libraries.filter((library) => library.name !== name));
  }

  function updateLibraryVersion(name: string, version: string) {
    onChange(
      libraries.map((library) => (library.name === name ? { ...library, version } : library))
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            aria-expanded={isOpen}
            className="w-full justify-between"
            role="combobox"
            type="button"
            variant="outline"
          >
            {libraries.length === 0 ? 'Select libraries' : `${libraries.length} libraries selected`}
            <ChevronsUpDownIcon data-icon="inline-end" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search or add a PyPI package..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {filteredLibraries.length === 0 && !canAddQuery ? (
                <CommandEmpty>No libraries found.</CommandEmpty>
              ) : null}
              {filteredLibraries.length > 0 ? (
                <CommandGroup heading="Suggested libraries">
                  {filteredLibraries.map((library) => (
                    <CommandItem key={library} value={library} onSelect={() => addLibrary(library)}>
                      {library}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {canAddQuery ? (
                <CommandGroup heading="Custom package">
                  <CommandItem value={normalizedQuery} onSelect={() => addLibrary(normalizedQuery)}>
                    <PlusIcon data-icon="inline-start" />
                    Add {normalizedQuery}
                  </CommandItem>
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {libraries.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {libraries.map((library) => (
            <div
              key={library.name}
              className="flex w-full items-center gap-2 rounded-md border bg-muted p-2"
            >
              <span className="inline-flex min-w-0 flex-1 items-center gap-1 text-sm">
                <CheckIcon className="size-3" />
                <span className="truncate">{library.name}</span>
              </span>
              <Input
                aria-label={`${library.name} version`}
                className="h-7 w-28"
                placeholder="Version"
                value={library.version}
                onChange={(event) => updateLibraryVersion(library.name, event.target.value)}
              />
              <Button
                aria-label={`Remove ${library.name}`}
                size="icon-xs"
                type="button"
                variant="ghost"
                onClick={() => removeLibrary(library.name)}
              >
                <XIcon />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

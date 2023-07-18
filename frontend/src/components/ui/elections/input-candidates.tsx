import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFieldArray, useForm } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export default function InputCandidates({ ...props }) {

  const { fields, append, remove } = useFieldArray({
    name: "candidates",
    control: props.form.control,
  })

  return (
    <>
      {fields.map((field, index) => (
        <FormField
          control={props.form.control}
          key={field.id}
          name={`candidates.${index}.value`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className={cn(index !== 0 && "sr-only")}>
                Candidates
              </FormLabel>
              <FormDescription className={cn(index !== 0 && "sr-only")}>
                Add minimun two candidates
              </FormDescription>
              <div className="flex flex-row item-center justify-center space-x-2">
                <FormControl>
                  <Input placeholder="Candidate Name" {...field} />
                </FormControl>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => remove(index)}>
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => append({ value: "" })
        }>
        Add Candidate
      </Button>
    </>
  );
}
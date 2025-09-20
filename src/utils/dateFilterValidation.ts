import { format } from "date-fns"

export interface DateFieldMapping {
  filterType: string
  databaseField: string
  displayName: string
  description: string
}

export const DATE_FIELD_MAPPINGS: DateFieldMapping[] = [
  {
    filterType: "entry",
    databaseField: "created_at",
    displayName: "Data de Lançamento",
    description: "Data em que o lançamento foi criado no sistema"
  },
  {
    filterType: "due",
    databaseField: "due_date", 
    displayName: "Data de Vencimento",
    description: "Data em que o lançamento vence"
  },
  {
    filterType: "settlement",
    databaseField: "settled_at",
    displayName: "Data de Quitação",
    description: "Data em que o lançamento foi quitado/liquidado"
  },
  {
    filterType: "competence",
    databaseField: "competence_date",
    displayName: "Data de Competência", 
    description: "Data de competência contábil do lançamento"
  }
]

export interface DateFilterDebugInfo {
  entryId: string
  filterType: string
  fieldName: string
  rawValue: any
  parsedDate: Date | null
  isValid: boolean
  dateOnly: string | null
  error?: string
}

export function getDateFieldInfo(filterType: string): DateFieldMapping | null {
  return DATE_FIELD_MAPPINGS.find(mapping => mapping.filterType === filterType) || null
}

export function extractAndValidateDate(entry: any, filterType: string): DateFilterDebugInfo {
  const fieldMapping = getDateFieldInfo(filterType)
  
  if (!fieldMapping) {
    return {
      entryId: entry.id,
      filterType,
      fieldName: "unknown",
      rawValue: null,
      parsedDate: null,
      isValid: false,
      dateOnly: null,
      error: `Unknown filter type: ${filterType}`
    }
  }

  const rawValue = entry[fieldMapping.databaseField]
  let parsedDate: Date | null = null
  let isValid = false
  let dateOnly: string | null = null
  let error: string | undefined

  if (rawValue) {
    try {
      parsedDate = new Date(rawValue)
      isValid = !isNaN(parsedDate.getTime())
      
      if (isValid) {
        dateOnly = format(parsedDate, 'yyyy-MM-dd')
      } else {
        error = "Invalid date format"
      }
    } catch (e) {
      error = `Date parsing error: ${e}`
    }
  } else {
    error = "No date value in field"
  }

  return {
    entryId: entry.id,
    filterType,
    fieldName: fieldMapping.databaseField,
    rawValue,
    parsedDate,
    isValid,
    dateOnly,
    error
  }
}

export function validateDateFilter(
  entry: any, 
  filterType: string, 
  startDate?: Date, 
  endDate?: Date
): { included: boolean; debugInfo: DateFilterDebugInfo; reason?: string } {
  
  const debugInfo = extractAndValidateDate(entry, filterType)
  
  // If date is invalid, exclude entry
  if (!debugInfo.isValid || !debugInfo.parsedDate) {
    return {
      included: false,
      debugInfo,
      reason: debugInfo.error || "Invalid date"
    }
  }

  // Special case: if filtering by settlement but no settlement date, exclude
  if (filterType === "settlement" && !debugInfo.rawValue) {
    return {
      included: false,
      debugInfo,
      reason: "No settlement date when filtering by settlement"
    }
  }

  // Check date range if provided
  if (startDate || endDate) {
    const entryDateOnly = new Date(
      debugInfo.parsedDate.getFullYear(), 
      debugInfo.parsedDate.getMonth(), 
      debugInfo.parsedDate.getDate()
    )

    if (startDate) {
      const startDateOnly = new Date(
        startDate.getFullYear(), 
        startDate.getMonth(), 
        startDate.getDate()
      )
      
      if (entryDateOnly < startDateOnly) {
        return {
          included: false,
          debugInfo,
          reason: `Date ${debugInfo.dateOnly} is before start date ${format(startDateOnly, 'yyyy-MM-dd')}`
        }
      }
    }

    if (endDate) {
      const endDateOnly = new Date(
        endDate.getFullYear(), 
        endDate.getMonth(), 
        endDate.getDate()
      )
      
      if (entryDateOnly > endDateOnly) {
        return {
          included: false,
          debugInfo,
          reason: `Date ${debugInfo.dateOnly} is after end date ${format(endDateOnly, 'yyyy-MM-dd')}`
        }
      }
    }
  }

  return {
    included: true,
    debugInfo,
    reason: "Passed all date filter criteria"
  }
}

export function logDateFilterSummary(
  totalEntries: number,
  filteredEntries: number,
  filterType: string,
  startDate?: Date,
  endDate?: Date
) {
  console.log("📊 [DATE FILTER SUMMARY]", {
    totalEntries,
    filteredEntries,
    excluded: totalEntries - filteredEntries,
    filterType,
    dateRange: {
      start: startDate ? format(startDate, 'yyyy-MM-dd') : null,
      end: endDate ? format(endDate, 'yyyy-MM-dd') : null
    },
    fieldMapping: getDateFieldInfo(filterType)
  })
}
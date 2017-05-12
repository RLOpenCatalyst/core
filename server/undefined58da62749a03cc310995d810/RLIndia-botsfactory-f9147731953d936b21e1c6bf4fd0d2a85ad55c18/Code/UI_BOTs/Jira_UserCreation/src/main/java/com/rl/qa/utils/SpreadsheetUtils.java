package com.rl.qa.utils;

import org.apache.poi.hssf.usermodel.HSSFSheet;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import static junit.framework.Assert.assertTrue;

public class SpreadsheetUtils {


    // IWMS spreadsheet file.
    private File file;

    // The one and only sheet expected from the Excel workbook.
    private Sheet sheet;



    public String getCellValue(String colHeader,int rowNum) {
        int numberOfCells = 0;
        int colIndex = 0;
        String cellValue = "";
        Iterator rowIterator = this.sheet.rowIterator();
        while (rowIterator.hasNext())
        {
            Row headerRow = (Row) rowIterator.next();
            numberOfCells = headerRow.getPhysicalNumberOfCells();
            for(int i=0;i<numberOfCells;i++){
                if(headerRow.getCell(i).getCellType()== Cell.CELL_TYPE_STRING){
                    cellValue = headerRow.getCell(i).getStringCellValue();
                }

                if(headerRow.getCell(i).getCellType()==Cell.CELL_TYPE_NUMERIC){
                    cellValue = String.valueOf(headerRow.getCell(i).getNumericCellValue());
                }

                if(headerRow.getCell(i).getCellType()==Cell.CELL_TYPE_BOOLEAN){
                    cellValue = String.valueOf(headerRow.getCell(i).getBooleanCellValue());
                }

                if(colHeader.contains(cellValue)){
                    colIndex = headerRow.getCell(i).getColumnIndex();
                    break;
                }
            }
            if(colHeader.contains(cellValue)){
                break;
            }
        }

        String value = "";
        if(this.sheet.getRow(rowNum).getCell(colIndex).getCellType()==Cell.CELL_TYPE_STRING){
            value=String.valueOf(this.sheet.getRow(rowNum).getCell(colIndex).getStringCellValue());
        }

        if(this.sheet.getRow(rowNum).getCell(colIndex).getCellType()==Cell.CELL_TYPE_NUMERIC){
            value=String.valueOf(this.sheet.getRow(rowNum).getCell(colIndex).getNumericCellValue());
        }
        if(this.sheet.getRow(rowNum).getCell(colIndex).getCellType()==Cell.CELL_TYPE_BOOLEAN){
            value=String.valueOf(this.sheet.getRow(rowNum).getCell(colIndex).getBooleanCellValue());
        }
        return value;
    }


    public static String getFileSuffix(File file) {
        if (file == null) {
            return null;
        }

        int dot = file.getName().lastIndexOf('.');

        assertTrue(String.format("File '%s' does not have a file suffix!", file.getName()), dot > -1);

        String suffix = file.getName().substring(dot);

        if (suffix.equalsIgnoreCase(".xls")) {
            return ".xls";
        } else if (suffix.equalsIgnoreCase(suffix)) {
            return ".xlsx";
        } else {
            String msg = String.format(
                "File '%s' is not of a support type ['xls','xlsx]!",
                file.getName()
            );

            throw new IllegalStateException(msg);
        }
    }

    private Sheet getSheet(File spreadsheet) throws IOException {
        String suffix = getFileSuffix(spreadsheet);
        FileInputStream inputStream = new FileInputStream(spreadsheet);
        if (suffix.equals(".xlsx")) {
            XSSFWorkbook book = new XSSFWorkbook(inputStream);
            XSSFSheet   sheet = book.getSheetAt(0);

            return sheet;
        } else {
            HSSFWorkbook book = new HSSFWorkbook(inputStream);
            HSSFSheet   sheet = book.getSheetAt(0);

            return sheet;
        }
    }


    /**
     * Create instance given the spreadsheet file.
     *
     * @param spreadsheet - file containing an IWMS spreadsheet
     */
    public SpreadsheetUtils(File spreadsheet) throws IOException {
        this.file      = spreadsheet;
        this.sheet = this.getSheet(spreadsheet);
    }

    public static void main(String args[]){
        try{
            SpreadsheetUtils obj = new SpreadsheetUtils(new File("C:/Users/RLE0239/Desktop/Sales.xls"));
            System.out.println(System.getProperty("user.dir"));
            System.out.println(obj.getCellValue("Sales Group", 5));
            System.out.println(obj.getCellValue("Currency Type",4));
            System.out.println(obj.getCellValue("Currency Type",6));
        }catch(Exception e){

        }

    }

    public String getDateCellValue(String colHeader,int rowNum) {
        int numberOfCells = 0;
        int colIndex = 0;
        String cellValue = "";
        Iterator rowIterator = this.sheet.rowIterator();
        while (rowIterator.hasNext())
        {
            Row headerRow = (Row) rowIterator.next();
            numberOfCells = headerRow.getPhysicalNumberOfCells();
            for(int i=0;i<numberOfCells;i++){
                if(headerRow.getCell(i).getCellType()== Cell.CELL_TYPE_STRING){
                    cellValue = headerRow.getCell(i).getStringCellValue();
                }

                if(headerRow.getCell(i).getCellType()==Cell.CELL_TYPE_NUMERIC){
                    cellValue = String.valueOf(headerRow.getCell(i).getNumericCellValue());
                }

                if(headerRow.getCell(i).getCellType()==Cell.CELL_TYPE_BOOLEAN){
                    cellValue = String.valueOf(headerRow.getCell(i).getBooleanCellValue());
                }

                if(colHeader.contains(cellValue)){
                    colIndex = headerRow.getCell(i).getColumnIndex();
                    break;
                }
            }
            if(colHeader.contains(cellValue)){
                break;
            }
        }

        DataFormatter df = new DataFormatter();
        String value = df.formatCellValue(this.sheet.getRow(rowNum).getCell(colIndex));
        return value;
    }

    public String getCellValueMoreThanOneSameHeaderName(String colHeader,int rowNum) {
        int numberOfCells = 0;
        List<Integer> colIndex = new ArrayList<>();
        String cellValue = "";
        int headerCount = 0;
        Iterator rowIterator = this.sheet.rowIterator();
        while (rowIterator.hasNext())
        {
            Row headerRow = (Row) rowIterator.next();
            numberOfCells = headerRow.getPhysicalNumberOfCells();
            for(int i=0;i<numberOfCells;i++){
                if(headerRow.getCell(i).getCellType()== Cell.CELL_TYPE_STRING){
                    cellValue = headerRow.getCell(i).getStringCellValue();
                }

                if(headerRow.getCell(i).getCellType()==Cell.CELL_TYPE_NUMERIC){
                    cellValue = String.valueOf(headerRow.getCell(i).getNumericCellValue());
                }

                if(headerRow.getCell(i).getCellType()==Cell.CELL_TYPE_BOOLEAN){
                    cellValue = String.valueOf(headerRow.getCell(i).getBooleanCellValue());
                }

                if(colHeader.contains(cellValue)){
                    colIndex .add(headerRow.getCell(i).getColumnIndex());
                    headerCount++;
                }
            }
        }

        if(headerCount>1){
            System.out.println("Same header name is present more than one: "+headerCount);
        }else if(headerCount==0){
            System.out.println("Same header name is not present "+headerCount);
        }

        String value = "";
        for(int i=0;i<colIndex.size();i++){
            if(this.sheet.getRow(rowNum).getCell(colIndex.get(i)).getCellType()==Cell.CELL_TYPE_STRING){
                value=String.valueOf(this.sheet.getRow(rowNum).getCell(colIndex.get(i)).getStringCellValue());
            }

            if(this.sheet.getRow(rowNum).getCell(colIndex.get(i)).getCellType()==Cell.CELL_TYPE_NUMERIC){
                value=String.valueOf(this.sheet.getRow(rowNum).getCell(colIndex.get(i)).getNumericCellValue());
            }
            if(this.sheet.getRow(rowNum).getCell(colIndex.get(i)).getCellType()==Cell.CELL_TYPE_BOOLEAN){
                value=String.valueOf(this.sheet.getRow(rowNum).getCell(colIndex.get(i)).getBooleanCellValue());
            }
            if (value!=null){
                break;
            }
        }
        return value;
    }
}

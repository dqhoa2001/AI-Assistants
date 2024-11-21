<?php

namespace App\Services;

use Google_Client;
use Google_Service_Sheets;
use Exception;

class GoogleSheetService
{
    protected $service;
    protected $client;

    public function __construct()
    {
        $this->client = new Google_Client();
        $this->client->setScopes([Google_Service_Sheets::SPREADSHEETS_READONLY]);
        $this->client->setAuthConfig(storage_path('app/service-account.json'));
        $this->service = new Google_Service_Sheets($this->client);
    }

    /**
     * Get sheet data from URL
     */
    public function getSheetData(string $url)
    {
        try {
            // Extract spreadsheet ID from URL
            $spreadsheetId = $this->getSpreadsheetId($url);
            
            // Get spreadsheet
            $spreadsheet = $this->service->spreadsheets->get($spreadsheetId);
            $sheets = $spreadsheet->getSheets();
            
            $sheetData = [];
            
            foreach ($sheets as $sheet) {
                $properties = $sheet->getProperties();
                $sheetId = $properties->getSheetId();
                $sheetName = $properties->getTitle();
                
                // Get all data from each sheet
                $range = $sheetName;
                $response = $this->service->spreadsheets_values->get($spreadsheetId, $range);
                $values = $response->getValues();
                
                if (!empty($values)) {
                    $headers = array_shift($values); // Get and remove headers
                    
                    $sheetData[] = [
                        'sheet_name' => $sheetName,
                        'headers' => $headers,
                        'content' => $values
                    ];
                }
            }

            return [
                'spreadsheet_name' => $spreadsheet->getProperties()->getTitle(),
                'sheets' => $sheetData
            ];

        } catch (Exception $e) {
            throw new Exception('Failed to fetch sheet data: ' . $e->getMessage());
        }
    }

    /**
     * Extract spreadsheet ID from Google Sheets URL
     */
    protected function getSpreadsheetId(string $url): string
    {
        preg_match('/[-\w]{25,}/', $url, $matches);
        if (empty($matches)) {
            throw new Exception('Invalid Google Sheets URL');
        }
        return $matches[0];
    }
} 
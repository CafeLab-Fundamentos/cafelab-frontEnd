package com.cafemetrix.cafelab.iotmonitoring.interfaces.rest.resources;

public record IoTSimulatorReadingResource(
        double temperature,
        double humidity,
        String environmentalStatus,
        String dehumidifierStatus,
        String message
) {}

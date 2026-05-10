package com.cafemetrix.cafelab.iotmonitoring.interfaces.rest;

import com.cafemetrix.cafelab.iotmonitoring.domain.exceptions.IoTMonitoringDataNotFoundException;
import com.cafemetrix.cafelab.shared.interfaces.rest.resources.MessageResource;
import com.cafemetrix.cafelab.shared.interfaces.rest.support.CafeLabScopedExceptionHandlerSupport;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(basePackages = "com.cafemetrix.cafelab.iotmonitoring.interfaces.rest")
@Order(Ordered.HIGHEST_PRECEDENCE)
public class IoTMonitoringExceptionHandler extends CafeLabScopedExceptionHandlerSupport {

    @ExceptionHandler(IoTMonitoringDataNotFoundException.class)
    public ResponseEntity<MessageResource> handleNotFound(IoTMonitoringDataNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResource(ex.getMessage()));
    }
}

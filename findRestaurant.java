package com.amazonaws.samples;
/*
import java.util.Iterator;

import com.amazonaws.regions.Regions;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.document.DynamoDB;
import com.amazonaws.services.dynamodbv2.document.Item;
import com.amazonaws.services.dynamodbv2.document.ItemCollection;
import com.amazonaws.services.dynamodbv2.document.ScanOutcome;
import com.amazonaws.services.dynamodbv2.document.Table;
import com.amazonaws.services.dynamodbv2.document.spec.ScanSpec;
//import com.amazonaws.services.dynamodbv2.document.utils.NameMap;
//import com.amazonaws.services.dynamodbv2.document.utils.ValueMap;
import java.io.BufferedWriter;    
import java.io.File;    
import java.io.FileNotFoundException;    
import java.io.FileWriter;    
import java.io.IOException;    

public class findRestaurant {
    public static void main(String[] args) throws Exception {
    AmazonDynamoDB client = AmazonDynamoDBClientBuilder.standard()
            .withRegion(Regions.US_EAST_1)
            .build();  

    DynamoDB dynamoDB = new DynamoDB(client);
    File csv = new File("/Users/hanyuli/learn/courses/CC/Dynamodb/newdata.csv");
    BufferedWriter bw = new BufferedWriter(new FileWriter(csv, true)); 
    //bw.write("RestaurantId,Cuisine,Rating,NumberOfReviews,Neighborhood\n");
    Table table = dynamoDB.getTable("yelp-restaurants");

    ScanSpec scanSpec = new ScanSpec().withProjectionExpression("RestaurantID,info.Cuision,info.Rating,info.NumberOfReviews,info.Neighborhood");         

    try {
        ItemCollection<ScanOutcome> items = table.scan(scanSpec);

        Iterator<Item> iter = items.iterator();
        int k=10216;
        for (int i=0;i<k;i++) {
            iter.next();
        }
        int i=0;
        while (iter.hasNext()) {
            Item item = iter.next();
            System.out.println(item.getString("RestaurantID"));
            String info=item.getJSON("info");
            String[] array=info.split(",");
            double rating;
            int number;
            String cuision,neighborhood;
            String[] json=array[0].split(":");
            rating=Double.parseDouble(json[1]);
            json=array[1].split(":");
            cuision=json[1];
            json=array[2].split(":");
            number=Integer.parseInt(json[1]);
            json=array[3].split(":");
            neighborhood=json[1].split("}")[0];
            bw.write(item.getString("RestaurantID")+","+cuision+","+rating+","+number+","+neighborhood+"\n");
            i++;
            if (i==1000) break;
        }

    }
    catch (Exception e) {
        System.err.println("Unable to scan the table:");
        System.err.println(e.getMessage());
    }
    bw.close();
    }
}

*/

import com.amazonaws.regions.Regions;
import java.io.File;
import java.util.Iterator;
//import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.document.DynamoDB;
import com.amazonaws.services.dynamodbv2.document.Item;
import com.amazonaws.services.dynamodbv2.document.Table;
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;




public class findRestaurant {
    public static void main(String[] args) throws Exception {
        AmazonDynamoDB client = AmazonDynamoDBClientBuilder.standard()
                .withRegion(Regions.US_EAST_1)
                .build();  

        DynamoDB dynamoDB = new DynamoDB(client);
        Table table = dynamoDB.getTable("yelp-restaurants");
        JsonParser parser = new JsonFactory().createParser(new File("/Users/hanyuli/learn/courses/CC/Dynamodb/restaurants.json"));

        JsonNode rootNode = new ObjectMapper().readTree(parser);
        Iterator<JsonNode> iter = rootNode.iterator();

        ObjectNode currentNode;
        int i=0;
        while (iter.hasNext()) {
            currentNode = (ObjectNode) iter.next();
            
            String id = currentNode.path("RestaurantID").asText();
            try {
                table.putItem(new Item().withPrimaryKey("RestaurantID", id).withJSON("info",
                    currentNode.path("info").toString()));
                System.out.println("PutItem "+i+ " succeeded: " + id );

            }
            catch (Exception e) {
                System.err.println("Unable to add restaurant: " + id);
                System.err.println(e.getMessage());
            }
            i++;
        }
        System.out.println("put "+i+"items!");
        parser.close();
    }
}

